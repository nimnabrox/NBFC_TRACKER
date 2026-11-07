using System.Net;
using System.Text;
using System.Diagnostics;

namespace ChestCounter;

/// <summary>
/// Lightweight local HTTP server running at http://localhost:5088
/// Serves NimnaBro's live chest tracking dashboard, OBS Studio transparent overlay, CSV export, and JSON API.
/// </summary>
public static class WebDashboardServer
{
    private static HttpListener? _listener;
    private static Thread? _thread;
    public const int Port = 5088;
    public static string Url => $"http://localhost:{Port}/";
    public static string OverlayUrl => $"http://localhost:{Port}/overlay";
    public static bool IsListening => _listener != null && _listener.IsListening;

    private static Store? _store;
    private static Config? _config;
    private static TrackerData? _data;
    private static Func<bool>? _isLiveInProgress;
    private static Func<MatchRecord?>? _getLiveMatch;
    private static System.Threading.Timer? _cloudSyncTimer;

    public static void Start(Store store, Config config, TrackerData data, Func<bool>? isLiveInProgress = null, Func<MatchRecord?>? getLiveMatch = null)
    {
        _store = store;
        _config = config;
        _data = data;
        _isLiveInProgress = isLiveInProgress;
        _getLiveMatch = getLiveMatch;

        try
        {
            var logPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "ChestCounter", "trace.log");
            File.AppendAllText(logPath, $"[{DateTime.Now:HH:mm:ss.fff}] [WebDashboardServer] Starting on http://localhost:{Port}/ and http://127.0.0.1:{Port}/ ...\r\n");

            _listener = new HttpListener();
            _listener.Prefixes.Add($"http://localhost:{Port}/");
            _listener.Prefixes.Add($"http://127.0.0.1:{Port}/");
            _listener.Start();

            File.AppendAllText(logPath, $"[{DateTime.Now:HH:mm:ss.fff}] [WebDashboardServer] Listener started successfully!\r\n");

            _thread = new Thread(() =>
            {
                while (_listener != null && _listener.IsListening)
                {
                    try
                    {
                        var context = _listener.GetContext();
                        ThreadPool.QueueUserWorkItem(_ => HandleRequest(context));
                    }
                    catch (HttpListenerException) { break; }
                    catch (ObjectDisposedException) { break; }
                    catch { /* Continue */ }
                }
            })
            {
                IsBackground = true,
                Name = "WebDashboardServer"
            };
            _thread.Start();

            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine($"  [Web Dashboard] Live at {Url}");
            Console.WriteLine($"  [OBS Overlay]   Live at {OverlayUrl}");
            Console.ResetColor();

            // Sync initial state once on startup (no periodic spam timer!)
            SyncToCloudAsync();
        }
        catch (Exception ex)
        {
            try
            {
                var logPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "ChestCounter", "trace.log");
                File.AppendAllText(logPath, $"[{DateTime.Now:HH:mm:ss.fff}] [WebDashboardServer] ERROR: {ex}\r\n");
            }
            catch { }
            ErrorLog.Write("WebDashboardServer Start", ex);
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine($"  [Web Dashboard] Notice: Local port {Port} unavailable ({ex.Message}). Will open HTML file directly.");
            Console.ResetColor();
        }
    }

    private static void HandleRequest(HttpListenerContext context)
    {
        try
        {
            var req = context.Request;
            var res = context.Response;
            res.Headers.Add("Access-Control-Allow-Origin", "*");
            res.Headers.Add("Access-Control-Allow-Private-Network", "true");
            res.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.Headers.Add("Access-Control-Allow-Headers", "*");

            if (req.HttpMethod.Equals("OPTIONS", StringComparison.OrdinalIgnoreCase))
            {
                res.StatusCode = 204;
                res.Close();
                return;
            }

            var path = req.Url?.AbsolutePath ?? "/";

            // 1. Live Stats API (for OBS overlay and live updates)
            if (path.Equals("/api/live", StringComparison.OrdinalIgnoreCase))
            {
                res.ContentType = "application/json; charset=utf-8";
                var json = GetLiveStatsJson();
                var bytes = Encoding.UTF8.GetBytes(json);
                res.ContentLength64 = bytes.Length;
                res.OutputStream.Write(bytes, 0, bytes.Length);
                res.Close();
                return;
            }

            // 1b. Matches API (for Web Dashboard)
            if (path.Equals("/api/matches", StringComparison.OrdinalIgnoreCase))
            {
                res.ContentType = "application/json; charset=utf-8";
                var json = GetMatchesJson();
                var bytes = Encoding.UTF8.GetBytes(json);
                res.ContentLength64 = bytes.Length;
                res.OutputStream.Write(bytes, 0, bytes.Length);
                res.Close();
                return;
            }

            // 2. Set Custom Base Count API
            if (path.Equals("/api/set-base", StringComparison.OrdinalIgnoreCase))
            {
                var countStr = req.QueryString["count"];
                if (_config != null && _store != null && _data != null)
                {
                    if (string.IsNullOrWhiteSpace(countStr) ||
                        countStr.Equals("clear", StringComparison.OrdinalIgnoreCase) ||
                        countStr.Equals("reset", StringComparison.OrdinalIgnoreCase) ||
                        countStr.Equals("null", StringComparison.OrdinalIgnoreCase) ||
                        countStr == "0")
                    {
                        _config.BaseChestCount = null;
                        _store.SaveConfig(_config);
                        ReportWriter.WriteAll(_store, _config, _data);
                        Console.ForegroundColor = ConsoleColor.Cyan;
                        Console.WriteLine("  [Base Count Reset] Reverting to replay chest amount (empty default).");
                        Console.ResetColor();
                    }
                    else if (int.TryParse(countStr, out var count) && count > 0)
                    {
                        _config.BaseChestCount = count;
                        _store.SaveConfig(_config);
                        ReportWriter.WriteAll(_store, _config, _data);
                        Console.ForegroundColor = ConsoleColor.Cyan;
                        Console.WriteLine($"  [Base Count Saved] Custom starting chest count saved: {_config.BaseChestCount} (persisted in config.json)");
                        Console.ResetColor();
                    }
                    SyncToCloudAsync();
                }
                res.ContentType = "application/json; charset=utf-8";
                var bytes = Encoding.UTF8.GetBytes("{\"ok\":true}");
                res.ContentLength64 = bytes.Length;
                res.OutputStream.Write(bytes, 0, bytes.Length);
                res.Close();
                return;
            }

            // 2b. Set Active Account / Profile API
            if (path.Equals("/api/set-profile", StringComparison.OrdinalIgnoreCase))
            {
                var profileKey = req.QueryString["key"] ?? req.QueryString["profile"] ?? "";
                if (_config != null && _store != null && _data != null)
                {
                    if (profileKey.Equals("all", StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(profileKey))
                    {
                        _config.Profile = "all";
                    }
                    else
                    {
                        lock (_data)
                        {
                            var match = Profiles.List(_data).FirstOrDefault(p =>
                                p.Key.Equals(profileKey, StringComparison.OrdinalIgnoreCase) ||
                                (!string.IsNullOrEmpty(p.Name) && p.Name.Equals(profileKey, StringComparison.OrdinalIgnoreCase)));
                            _config.Profile = match != null ? match.Key : profileKey;
                        }
                    }
                    _store.SaveConfig(_config);
                    ReportWriter.WriteAll(_store, _config, _data);
                    Console.ForegroundColor = ConsoleColor.Cyan;
                    Console.WriteLine($"  [Account Switched] Active profile switched to: {_config.Profile}");
                    Console.ResetColor();
                    SyncToCloudAsync();
                }
                res.ContentType = "application/json; charset=utf-8";
                var bytes = Encoding.UTF8.GetBytes("{\"ok\":true}");
                res.ContentLength64 = bytes.Length;
                res.OutputStream.Write(bytes, 0, bytes.Length);
                res.Close();
                return;
            }

            // 2c. Get Settings API
            if (path.Equals("/api/settings", StringComparison.OrdinalIgnoreCase))
            {
                res.ContentType = "application/json; charset=utf-8";
                bool isStartup = false;
                if (OperatingSystem.IsWindows())
                {
                    try
                    {
                        using var rk = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", false);
                        isStartup = rk?.GetValue("NBFCTracker") != null;
                    }
                    catch { }
                }

                var demosFolder = _config?.DemosFolder ?? "";
                var baseCount = _config?.BaseChestCount;
                var baseStr = (baseCount.HasValue && baseCount.Value > 0) ? baseCount.Value.ToString() : "null";
                var startWithFn = _config?.StartWithFortnite ?? false;

                var json = $"{{\"demosFolder\":\"{EscapeJson(demosFolder)}\",\"startWithWindows\":{(isStartup ? "true" : "false")},\"startWithFortnite\":{(startWithFn ? "true" : "false")},\"baseChestCount\":{baseStr}}}";
                var bytes = Encoding.UTF8.GetBytes(json);
                res.ContentLength64 = bytes.Length;
                res.OutputStream.Write(bytes, 0, bytes.Length);
                res.Close();
                return;
            }

            // 2d. Set Windows Startup API
            if (path.Equals("/api/set-startup", StringComparison.OrdinalIgnoreCase))
            {
                var enabledStr = req.QueryString["enabled"] ?? "false";
                var enabled = enabledStr.Equals("true", StringComparison.OrdinalIgnoreCase) || enabledStr == "1";
                if (OperatingSystem.IsWindows())
                {
                    try
                    {
                        using var rk = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", true);
                        if (rk != null)
                        {
                            if (enabled && AppInfo.ExePath != null)
                            {
                                rk.SetValue("NBFCTracker", $"\"{AppInfo.ExePath}\" --minimized");
                            }
                            else
                            {
                                rk.DeleteValue("NBFCTracker", false);
                            }
                        }
                    }
                    catch { }
                }

                res.ContentType = "application/json; charset=utf-8";
                var bytes = Encoding.UTF8.GetBytes("{\"ok\":true}");
                res.ContentLength64 = bytes.Length;
                res.OutputStream.Write(bytes, 0, bytes.Length);
                res.Close();
                return;
            }

            // 2e. Set Custom Demos Folder API
            if (path.Equals("/api/set-demos-folder", StringComparison.OrdinalIgnoreCase))
            {
                var folder = req.QueryString["folder"];
                if (_config != null && _store != null && !string.IsNullOrWhiteSpace(folder) && Directory.Exists(folder))
                {
                    _config.DemosFolder = folder;
                    _store.SaveConfig(_config);
                }

                res.ContentType = "application/json; charset=utf-8";
                var bytes = Encoding.UTF8.GetBytes("{\"ok\":true}");
                res.ContentLength64 = bytes.Length;
                res.OutputStream.Write(bytes, 0, bytes.Length);
                res.Close();
                return;
            }

            // 3. Serve Chest Image for OBS Overlay and Dashboard
            if (path.Equals("/assets/chest.png", StringComparison.OrdinalIgnoreCase) || 
                path.Equals("/assets/chest_fnv1.png", StringComparison.OrdinalIgnoreCase))
            {
                var candidatePaths = new[]
                {
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "public", "assets", "chest_fnv1.png"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "chest_fnv1.png"),
                    Path.Combine(Directory.GetCurrentDirectory(), "public", "assets", "chest_fnv1.png"),
                    @"D:\Projects_Codes\Projects_Codes\NB FORTNITE CHEST TRACKER v2\public\assets\chest_fnv1.png"
                };

                var assetPath = candidatePaths.FirstOrDefault(File.Exists);
                if (assetPath != null)
                {
                    res.ContentType = "image/png";
                    var bytes = File.ReadAllBytes(assetPath);
                    res.ContentLength64 = bytes.Length;
                    res.OutputStream.Write(bytes, 0, bytes.Length);
                    res.Close();
                    return;
                }
            }

            // 4. OBS Studio Overlay (transparent, ultra-lightweight, zero-flicker)
            if (path.Equals("/overlay", StringComparison.OrdinalIgnoreCase) || path.Equals("/obs", StringComparison.OrdinalIgnoreCase))
            {
                res.ContentType = "text/html; charset=utf-8";
                var html = GetObsOverlayHtml();
                var bytes = Encoding.UTF8.GetBytes(html);
                res.ContentLength64 = bytes.Length;
                res.OutputStream.Write(bytes, 0, bytes.Length);
                res.Close();
                return;
            }

            // 5. Raw JSON Data API
            if (path.Equals("/api/data", StringComparison.OrdinalIgnoreCase))
            {
                res.ContentType = "application/json; charset=utf-8";
                if (_store != null && File.Exists(_store.DataPath))
                {
                    var bytes = File.ReadAllBytes(_store.DataPath);
                    res.ContentLength64 = bytes.Length;
                    res.OutputStream.Write(bytes, 0, bytes.Length);
                }
                else
                {
                    var bytes = Encoding.UTF8.GetBytes("{}");
                    res.ContentLength64 = bytes.Length;
                    res.OutputStream.Write(bytes, 0, bytes.Length);
                }
                res.Close();
                return;
            }

            // 6. CSV Export
            if (path.Equals("/csv", StringComparison.OrdinalIgnoreCase))
            {
                res.ContentType = "text/csv; charset=utf-8";
                res.Headers.Add("Content-Disposition", "attachment; filename=\"nimnabro_fortnite_chests.csv\"");
                if (_store != null && File.Exists(_store.CsvPath))
                {
                    var bytes = File.ReadAllBytes(_store.CsvPath);
                    res.ContentLength64 = bytes.Length;
                    res.OutputStream.Write(bytes, 0, bytes.Length);
                }
                res.Close();
                return;
            }

            // 7. Static Asset & Modern 1:2 Dashboard Router
            var cleanPath = path.TrimStart('/');
            if (string.IsNullOrEmpty(cleanPath) || cleanPath.Equals("index.html", StringComparison.OrdinalIgnoreCase))
            {
                cleanPath = "index.html";
            }
            else if (cleanPath.Equals("overlay", StringComparison.OrdinalIgnoreCase) || cleanPath.Equals("obs", StringComparison.OrdinalIgnoreCase))
            {
                cleanPath = "overlay.html";
            }

            var staticCandidates = new[]
            {
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "public", cleanPath),
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "v3", "public", cleanPath),
                Path.Combine(Directory.GetCurrentDirectory(), "public", cleanPath),
                Path.Combine(Directory.GetCurrentDirectory(), "v3", "public", cleanPath),
                Path.Combine(Directory.GetCurrentDirectory(), "web-chest-tracker", cleanPath),
                Path.Combine(@"D:\Projects_Codes\Projects_Codes\NB FORTNITE CHEST TRACKER v2\v3\public", cleanPath)
            };

            var resolvedFile = staticCandidates.FirstOrDefault(File.Exists);
            if (resolvedFile != null)
            {
                var ext = Path.GetExtension(resolvedFile).ToLowerInvariant();
                res.ContentType = ext switch
                {
                    ".html" => "text/html; charset=utf-8",
                    ".css" => "text/css; charset=utf-8",
                    ".js" or ".mjs" => "application/javascript; charset=utf-8",
                    ".json" => "application/json; charset=utf-8",
                    ".png" => "image/png",
                    ".svg" => "image/svg+xml",
                    ".ico" => "image/x-icon",
                    _ => "application/octet-stream"
                };

                var bytes = File.ReadAllBytes(resolvedFile);
                res.ContentLength64 = bytes.Length;
                res.OutputStream.Write(bytes, 0, bytes.Length);
                res.Close();
                return;
            }

            // Embedded Resources Fallback: Enables 100% standalone single-file .exe operation on ANY new PC with zero external folders
            var asm = typeof(AppInfo).Assembly;
            var resNames = asm.GetManifestResourceNames();
            var targetSuffix = cleanPath.Replace('/', '.').Replace('\\', '.');
            var matchedRes = resNames.FirstOrDefault(r =>
                r.EndsWith("." + targetSuffix, StringComparison.OrdinalIgnoreCase) ||
                r.EndsWith("." + Path.GetFileName(cleanPath), StringComparison.OrdinalIgnoreCase));

            if (matchedRes != null)
            {
                using var stream = asm.GetManifestResourceStream(matchedRes);
                if (stream != null)
                {
                    var ext = Path.GetExtension(cleanPath).ToLowerInvariant();
                    res.ContentType = ext switch
                    {
                        ".html" => "text/html; charset=utf-8",
                        ".css" => "text/css; charset=utf-8",
                        ".js" or ".mjs" => "application/javascript; charset=utf-8",
                        ".json" => "application/json; charset=utf-8",
                        ".png" => "image/png",
                        ".svg" => "image/svg+xml",
                        ".ico" => "image/x-icon",
                        _ => "application/octet-stream"
                    };

                    res.ContentLength64 = stream.Length;
                    stream.CopyTo(res.OutputStream);
                    res.Close();
                    return;
                }
            }

            // Fallback to legacy report if static index not found
            res.ContentType = "text/html; charset=utf-8";
            if (_store != null && File.Exists(_store.ReportPath))
            {
                var bytes = File.ReadAllBytes(_store.ReportPath);
                res.ContentLength64 = bytes.Length;
                res.OutputStream.Write(bytes, 0, bytes.Length);
            }
            else
            {
                var html = "<html><body style='font-family:sans-serif;background:#0d0f14;color:#fff;padding:40px;text-align:center;'>"
                         + "<h1 style='color:#f5a623;'>NBFC TRACKER v3</h1>"
                         + "<p>Analyzing replays and building initial dashboard... Please wait.</p>"
                         + "<meta http-equiv='refresh' content='2'></body></html>";
                var bytes = Encoding.UTF8.GetBytes(html);
                res.ContentLength64 = bytes.Length;
                res.OutputStream.Write(bytes, 0, bytes.Length);
            }
            res.Close();
        }
        catch
        {
            // Socket closed or connection aborted
        }
    }

    private static readonly HttpClient _syncClient = new() { Timeout = TimeSpan.FromSeconds(5) };
    private static string _lastSyncedPayloadMain = "";
    private static string _lastSyncedPayloadPlayer = "";
    private static readonly object _syncLock = new();

    public static void SyncToCloudAsync()
    {
        Task.Run(async () =>
        {
            try
            {
                string activePlayer = "nimnabro";
                if (_data != null && _config != null)
                {
                    lock (_data)
                    {
                        var cur = Profiles.Current(_data, _config);
                        if (cur != null && !string.IsNullOrWhiteSpace(cur.Name))
                            activePlayer = cur.Name.Trim();
                    }
                }

                // 1. Sync to main room "nimnabro" (the global live endpoint for nbfct.nimnabro.com)
                var mainPayload = GetCloudSyncPayload("nimnabro");
                bool mainChanged;
                lock (_syncLock)
                {
                    mainChanged = (mainPayload != _lastSyncedPayloadMain);
                    if (mainChanged) _lastSyncedPayloadMain = mainPayload;
                }

                if (mainChanged)
                {
                    using var c1 = new StringContent(mainPayload, Encoding.UTF8, "application/json");
                    await _syncClient.PostAsync("https://nbfct.nimnabro.com/api/sync", c1);
                }

                // 2. If active player name is distinct, also sync to that player's room
                if (!activePlayer.Equals("nimnabro", StringComparison.OrdinalIgnoreCase) && !activePlayer.Equals("All Accounts", StringComparison.OrdinalIgnoreCase))
                {
                    var playerPayload = GetCloudSyncPayload(activePlayer.ToLowerInvariant());
                    bool playerChanged;
                    lock (_syncLock)
                    {
                        playerChanged = (playerPayload != _lastSyncedPayloadPlayer);
                        if (playerChanged) _lastSyncedPayloadPlayer = playerPayload;
                    }

                    if (playerChanged)
                    {
                        using var c2 = new StringContent(playerPayload, Encoding.UTF8, "application/json");
                        await _syncClient.PostAsync("https://nbfct.nimnabro.com/api/sync", c2);
                    }
                }
            }
            catch { }
        });
    }

    private static string GetCloudSyncPayload(string targetRoom)
    {
        if (_data == null || _config == null)
        {
            return $"{{\"room\":\"{EscapeJson(targetRoom)}\",\"total\":0,\"lastMatch\":0,\"liveChests\":0,\"base\":null,\"session\":0,\"player\":\"nimnabro\",\"accounts\":[],\"matches\":[],\"inProgress\":false}}";
        }

        try
        {
            MatchRecord[] matchArray;
            string playerName = "nimnabro";
            lock (_data)
            {
                var view = Profiles.View(_data, _config);
                matchArray = view.Matches.ToArray();
                var cur = Profiles.Current(_data, _config);
                if (cur != null && !string.IsNullOrWhiteSpace(cur.Name))
                {
                    playerName = cur.Name;
                }
                else if (string.Equals(_config.Profile, "all", StringComparison.OrdinalIgnoreCase) || string.IsNullOrEmpty(_config.Profile))
                {
                    playerName = "All Accounts";
                }
            }
            var baseCount = _config.BaseChestCount;
            var matches = matchArray.OrderByDescending(ReportWriter.When).ToList();
            var inProgress = _isLiveInProgress?.Invoke() ?? false;
            var liveChests = _getLiveMatch?.Invoke()?.ChestsOpened ?? 0;
            var sessionChests = matches.Where(ReportWriter.IsThisSession).Sum(m => m.ChestsOpened) + liveChests;
            var totalChests = matches.Sum(m => m.ChestsOpened) + liveChests;
            var displayedTotal = (baseCount.HasValue && baseCount.Value > 0) ? baseCount.Value + sessionChests : totalChests;
            var lastMatch = matches.Count > 0 ? matches[0].ChestsOpened : 0;
            var baseJson = (baseCount.HasValue && baseCount.Value > 0) ? baseCount.Value.ToString() : "null";

            // Format accounts list
            var profileItems = Profiles.List(_data).Select(p =>
            {
                var isActive = (p.Key == _config.Profile || (!string.IsNullOrEmpty(_config.Profile) && p.Name.Equals(_config.Profile, StringComparison.OrdinalIgnoreCase)));
                return $"{{\"key\":\"{EscapeJson(p.Key)}\",\"name\":\"{EscapeJson(p.Name)}\",\"matches\":{p.Matches},\"chests\":{p.Chests},\"active\":{(isActive ? "true" : "false")}}}";
            });
            var accountsJson = "[" + string.Join(",", profileItems) + "]";
            var matchesJson = GetMatchesJson();

            return $"{{\"room\":\"{EscapeJson(targetRoom)}\",\"total\":{displayedTotal},\"lastMatch\":{lastMatch},\"liveChests\":{liveChests},\"base\":{baseJson},\"session\":{sessionChests},\"player\":\"{EscapeJson(playerName)}\",\"accounts\":{accountsJson},\"matches\":{matchesJson},\"inProgress\":{(inProgress ? "true" : "false")}}}";
        }
        catch
        {
            return $"{{\"room\":\"{EscapeJson(targetRoom)}\",\"total\":0,\"lastMatch\":0,\"liveChests\":0,\"base\":null,\"session\":0,\"player\":\"nimnabro\",\"accounts\":[],\"matches\":[],\"inProgress\":false}}";
        }
    }

    private static string GetLiveStatsJson()
    {
        return GetCloudSyncPayload("nimnabro");
    }

    private static string GetMatchesJson()
    {
        if (_data == null || _config == null) return "[]";
        try
        {
            MatchRecord[] matchArray;
            lock (_data)
            {
                var view = Profiles.View(_data, _config);
                matchArray = view.Matches.ToArray();
            }
            var items = matchArray.OrderByDescending(ReportWriter.When).Take(150).Select(m =>
            {
                var fn = Path.GetFileName(m.ReplayFile ?? "");
                var start = ReportWriter.When(m).ToString("o");
                var pl = m.Playlist ?? "Battle Royale";
                var place = m.Placement.HasValue ? m.Placement.Value.ToString() : "null";
                var elim = m.Eliminations.HasValue ? m.Eliminations.Value.ToString() : "0";
                var player = EscapeJson(m.PlayerName ?? "nimnabro");
                return $"{{\"fileName\":\"{EscapeJson(fn)}\",\"matchStart\":\"{start}\",\"durationSeconds\":{m.DurationSeconds},\"playlist\":\"{EscapeJson(pl)}\",\"placement\":{place},\"chestsOpened\":{m.ChestsOpened},\"eliminations\":{elim},\"playerName\":\"{player}\"}}";
            });
            return "[" + string.Join(",", items) + "]";
        }
        catch { return "[]"; }
    }

    private static string EscapeJson(string s) => (s ?? "").Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", "").Replace("\n", " ");

    private static string GetObsOverlayHtml()
    {
        return """
            <!doctype html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <title>OBS Chest Overlay</title>
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&display=swap" rel="stylesheet">
              <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                html, body {
                  background: transparent !important;
                  overflow: hidden;
                  display: flex;
                  align-items: flex-start;
                  justify-content: flex-start;
                  padding: 4px;
                  font-family: 'Montserrat', 'Segoe UI Black', 'Impact', system-ui, sans-serif;
                }
                .pill {
                  display: inline-flex;
                  align-items: center;
                  padding: 10px 22px 10px 14px;
                  background: #1c1f26;
                  border: 2px solid #b7791f;
                  border-radius: 20px;
                  box-shadow: inset 0 0 14px rgba(183, 121, 31, 0.25);
                  overflow: hidden;
                  user-select: none;
                }
                .chest-box {
                  position: relative;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 64px;
                  height: 64px;
                  flex-shrink: 0;
                }
                .chest-halo {
                  position: absolute;
                  width: 74px;
                  height: 74px;
                  border-radius: 50%;
                  background: radial-gradient(circle, rgba(245, 166, 35, 0.65) 0%, rgba(245, 166, 35, 0.25) 45%, rgba(245, 166, 35, 0) 72%);
                  filter: blur(4px);
                  pointer-events: none;
                }
                .chest-img {
                  position: relative;
                  width: 60px;
                  height: 60px;
                  object-fit: contain;
                  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.6));
                }
                .divider {
                  width: 2px;
                  height: 48px;
                  background: rgba(255, 255, 255, 0.16);
                  margin: 0 18px 0 14px;
                  flex-shrink: 0;
                }
                .stat-box {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .counter {
                  font-size: 52px;
                  font-weight: 900;
                  line-height: 1;
                  color: #f7a81b;
                  font-variant-numeric: tabular-nums;
                  letter-spacing: -0.01em;
                  text-shadow: 0 0 18px rgba(247, 168, 27, 0.65), 0 2px 4px rgba(0, 0, 0, 0.9);
                  transition: transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
              </style>
            </head>
            <body>
              <div class="pill">
                <div class="chest-box">
                  <div class="chest-halo"></div>
                  <img src="/assets/chest.png" alt="Chest" class="chest-img">
                </div>
                <div class="divider"></div>
                <div class="stat-box">
                  <div id="total" class="counter">—</div>
                </div>
              </div>

              <script>
                let lastTotal = null;
                async function updateLive() {
                  try {
                    const res = await fetch('/api/live');
                    if (!res.ok) return;
                    const d = await res.json();
                    
                    if (d.total !== lastTotal) {
                      const el = document.getElementById('total');
                      el.textContent = Number(d.total).toLocaleString('en-US');
                      el.style.transform = 'scale(1.10)';
                      setTimeout(() => el.style.transform = 'scale(1)', 180);
                      lastTotal = d.total;
                    }
                  } catch (err) {}
                }
                setInterval(updateLive, 1000);
                updateLive();
              </script>
            </body>
            </html>
            """;
    }

    public static void OpenInBrowser(string fallbackFilePath)
    {
        var target = IsListening ? Url : fallbackFilePath;
        try
        {
            Process.Start(new ProcessStartInfo(target) { UseShellExecute = true });
        }
        catch
        {
            Console.WriteLine($"  Open this link in your browser: {target}");
        }
    }

    public static void Stop()
    {
        try
        {
            _listener?.Stop();
            _listener?.Close();
        }
        catch { }
    }
}
