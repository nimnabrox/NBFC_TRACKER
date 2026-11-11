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
    public static int Port { get; } = int.TryParse(Environment.GetEnvironmentVariable("NBFC_PORT"), out var port) && port is > 1024 and < 65536 ? port : 5088;
    public static string Url => $"http://localhost:{Port}/";
    public static string OverlayUrl => $"http://localhost:{Port}/overlay";
    public static bool IsListening => _listener != null && _listener.IsListening;
    public static int UiZoomPercent => Math.Clamp(_config?.UiZoomPercent ?? 100, 50, 150);

    private static Store? _store;
    private static Config? _config;
    private static TrackerData? _data;
    private static Func<bool>? _isLiveInProgress;
    private static Func<MatchRecord?>? _getLiveMatch;
    private static UpdateInfo? _cachedUpdate;
    private static int _installingUpdate;
    private static volatile string _updateStatus = "idle";

    public static void Start(Store store, Config config, TrackerData data, Func<bool>? isLiveInProgress = null, Func<MatchRecord?>? getLiveMatch = null)
    {
        _store = store;
        _config = config;
        _data = data;
        DashboardLanguage.Set(config.UiLanguage ?? config.Language ?? "en");
        _isLiveInProgress = isLiveInProgress;
        _getLiveMatch = getLiveMatch;

        try
        {
            var logPath = Path.Combine(store.Folder, "trace.log");
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

        }
        catch (Exception ex)
        {
            try
            {
                var logPath = Path.Combine(store.Folder, "trace.log");
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

            if (path.Equals("/api/set-language", StringComparison.OrdinalIgnoreCase))
            {
                var code = req.QueryString["code"];
                if (!DashboardLanguage.Set(code)) { res.StatusCode = 400; res.Close(); return; }
                if (_config != null && _store != null) { _config.UiLanguage = DashboardLanguage.Code; _store.SaveConfig(_config); }
                MainGuiForm.CurrentInstance?.RefreshLanguage();
                res.ContentType = "application/json; charset=utf-8";
                var bytes = Encoding.UTF8.GetBytes("{\"ok\":true}");
                res.OutputStream.Write(bytes); res.Close(); return;
            }

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
                if (!string.IsNullOrWhiteSpace(countStr) && countStr != "clear" && countStr != "reset" && countStr != "null"
                    && (!int.TryParse(countStr, out var validCount) || validCount < 0))
                { res.StatusCode = 400; res.Close(); return; }
                var targetProfile = req.QueryString["profile"] ?? req.QueryString["key"];
                if (_config != null && _store != null && _data != null)
                {
                    lock (_data)
                    {
                        var all = Profiles.List(_data);
                        Profile? target = null;
                        if (!string.IsNullOrWhiteSpace(targetProfile))
                        {
                            target = all.FirstOrDefault(p =>
                                p.Key.Equals(targetProfile, StringComparison.OrdinalIgnoreCase) ||
                                (!string.IsNullOrEmpty(p.Name) && p.Name.Equals(targetProfile, StringComparison.OrdinalIgnoreCase)));
                        }
                        target ??= Profiles.Current(_data, _config);

                        var pKey = target?.Key ?? targetProfile?.Trim() ?? _config.Profile ?? "";
                        var pName = target?.Name ?? "";

                        if (string.IsNullOrWhiteSpace(countStr) ||
                            countStr.Equals("clear", StringComparison.OrdinalIgnoreCase) ||
                            countStr.Equals("reset", StringComparison.OrdinalIgnoreCase) ||
                            countStr.Equals("null", StringComparison.OrdinalIgnoreCase) ||
                            countStr == "0")
                        {
                            if (!string.IsNullOrWhiteSpace(pKey)) _config.SetBaseChestForProfile(pKey, null);
                            if (!string.IsNullOrWhiteSpace(pName)) _config.SetBaseChestForProfile(pName, null);
                            _store.SaveConfig(_config);
                            ReportWriter.WriteAll(_store, _config, _data);
                            Console.ForegroundColor = ConsoleColor.Cyan;
                            Console.WriteLine($"  [Base Count Reset] Reverting to replay chest amount for profile: {pKey} / {pName}");
                            Console.ResetColor();
                        }
                        else if (int.TryParse(countStr, out var count) && count > 0)
                        {
                            if (!string.IsNullOrWhiteSpace(pKey)) _config.SetBaseChestForProfile(pKey, count);
                            if (!string.IsNullOrWhiteSpace(pName)) _config.SetBaseChestForProfile(pName, count);
                            var replayTotal = _data.Matches.Where(m => Profiles.Key(m).Equals(pKey, StringComparison.OrdinalIgnoreCase)).Sum(m => m.ChestsOpened);
                            if (!string.IsNullOrWhiteSpace(pKey)) _config.ProfileBaseReplayTotals[pKey] = replayTotal;
                            if (!string.IsNullOrWhiteSpace(pName)) _config.ProfileBaseReplayTotals[pName] = replayTotal;
                            var liveAtSave = (_isLiveInProgress?.Invoke() ?? false) ? _getLiveMatch?.Invoke() : null;
                            var liveBaseline = liveAtSave != null && (Profiles.Key(liveAtSave).Equals(pKey, StringComparison.OrdinalIgnoreCase)
                                || string.Equals(liveAtSave.PlayerName, pName, StringComparison.OrdinalIgnoreCase)) ? liveAtSave.ChestsOpened : 0;
                            if (!string.IsNullOrWhiteSpace(pKey)) _config.ProfileBaseLiveTotals[pKey] = liveBaseline;
                            if (!string.IsNullOrWhiteSpace(pName)) _config.ProfileBaseLiveTotals[pName] = liveBaseline;
                            _store.SaveConfig(_config);
                            ReportWriter.WriteAll(_store, _config, _data);
                            Console.ForegroundColor = ConsoleColor.Cyan;
                            Console.WriteLine($"  [Base Count Saved] Custom starting chest count saved for {pKey} / {pName}: {count} (persisted in config.json)");
                            Console.ResetColor();
                        }
                    }
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
                    lock (_data)
                    {
                        var all = Profiles.List(_data);
                        if (all.Count > 0)
                        {
                            var match = all.FirstOrDefault(p =>
                                p.Key.Equals(profileKey, StringComparison.OrdinalIgnoreCase) ||
                                (!string.IsNullOrEmpty(p.Name) && p.Name.Equals(profileKey, StringComparison.OrdinalIgnoreCase)));
                            _config.Profile = match != null ? match.Key : (string.IsNullOrWhiteSpace(profileKey) || profileKey.Equals("all", StringComparison.OrdinalIgnoreCase) ? all[0].Key : profileKey);
                        }
                        else
                        {
                            _config.Profile = profileKey;
                        }
                    }
                    _store.SaveConfig(_config);
                    ReportWriter.WriteAll(_store, _config, _data);
                    Console.ForegroundColor = ConsoleColor.Cyan;
                    Console.WriteLine($"  [Account Switched] Active profile switched to: {_config.Profile}");
                    Console.ResetColor();
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
                int? baseCount = null;
                string activePlayer = "";
                if (_config != null && _data != null)
                {
                    lock (_data)
                    {
                        var cur = Profiles.Current(_data, _config);
                        activePlayer = cur?.Name ?? _config.Profile ?? "";
                        baseCount = _config.GetBaseChestForProfile(cur?.Key) ?? _config.GetBaseChestForProfile(cur?.Name) ?? _config.GetBaseChestForProfile(_config.Profile);
                    }
                }
                var baseStr = (baseCount.HasValue && baseCount.Value > 0) ? baseCount.Value.ToString() : "null";
                var startWithFn = _config?.StartWithFortnite ?? false;

                var overlayOptions = System.Text.Json.JsonSerializer.Serialize(_config?.OverlayOptions ?? new(), new System.Text.Json.JsonSerializerOptions(System.Text.Json.JsonSerializerDefaults.Web));
                var json = $"{{\"demosFolder\":\"{EscapeJson(demosFolder)}\",\"startWithWindows\":{(isStartup ? "true" : "false")},\"startWithFortnite\":{(startWithFn ? "true" : "false")},\"baseChestCount\":{baseStr},\"activeProfile\":\"{EscapeJson(activePlayer)}\",\"uiLanguage\":\"{EscapeJson(_config?.UiLanguage ?? _config?.Language ?? "en")}\",\"version\":\"{AppInfo.DisplayVersion}\",\"overlayOptions\":{overlayOptions},\"uiZoomPercent\":{UiZoomPercent}}}";
                var bytes = Encoding.UTF8.GetBytes(json);
                res.ContentLength64 = bytes.Length;
                res.OutputStream.Write(bytes, 0, bytes.Length);
                res.Close();
                return;
            }

            if (path.Equals("/api/set-overlay-options", StringComparison.OrdinalIgnoreCase))
            {
                if (req.HttpMethod != "POST") { res.StatusCode = 405; res.Close(); return; }
                if (_config == null || _store == null) { res.StatusCode = 503; res.Close(); return; }
                try
                {
                    if (req.ContentLength64 > 4096) { res.StatusCode = 413; res.Close(); return; }
                    var options = System.Text.Json.JsonSerializer.Deserialize<OverlayPreferences>(req.InputStream, new System.Text.Json.JsonSerializerOptions(System.Text.Json.JsonSerializerDefaults.Web));
                    if (options == null || (options.Label?.Length ?? 0) > 64 || (options.Label?.Any(char.IsControl) ?? false))
                    { res.StatusCode = 400; res.Close(); return; }
                    options.Label ??= "";
                    _config.OverlayOptions = options; _store.SaveConfig(_config);
                    WriteJson(res, new { ok = true });
                }
                catch { res.StatusCode = 400; res.Close(); }
                return;
            }
            if (path.Equals("/api/set-zoom", StringComparison.OrdinalIgnoreCase))
            {
                if (_config == null || _store == null) { res.StatusCode = 503; res.Close(); return; }
                if (!int.TryParse(req.QueryString["percent"], out var percent) || percent < 50 || percent > 150)
                { res.StatusCode = 400; res.Close(); return; }
                _config.UiZoomPercent = percent;
                _store.SaveConfig(_config);
                MainGuiForm.CurrentInstance?.SetZoomPercent(percent);
                WriteJson(res, new { ok = true, uiZoomPercent = percent });
                return;
            }
            if (path.Equals("/api/check-update", StringComparison.OrdinalIgnoreCase))
            {
                var check = Updater.CheckDetailedAsync().GetAwaiter().GetResult();
                _cachedUpdate = check.HasUpdate ? check.Release : null;
                WriteJson(res, new {
                    hasUpdate = check.HasUpdate, available = check.ErrorCode == null, errorCode = check.ErrorCode,
                    currentVersion = AppInfo.DisplayVersion, latestVersion = check.Release?.Tag,
                    url = check.Release?.PageUrl ?? AppInfo.RepoUrl + "/releases/latest",
                    size = check.Release?.Size, changelog = check.Release?.Changelog
                });
                return;
            }
            if (path.Equals("/api/update-status", StringComparison.OrdinalIgnoreCase))
            {
                WriteJson(res, new { installing = Volatile.Read(ref _installingUpdate) == 1, status = _updateStatus });
                return;
            }
            if (path.Equals("/api/apply-update", StringComparison.OrdinalIgnoreCase))
            {
                if (Interlocked.CompareExchange(ref _installingUpdate, 1, 0) != 0)
                { WriteJson(res, new { success = false, errorCode = "busy" }); return; }
                try
                {
                    var update = _cachedUpdate ?? Updater.CheckAsync().GetAwaiter().GetResult();
                    if (update == null)
                    {
                        Interlocked.Exchange(ref _installingUpdate, 0);
                        WriteJson(res, new { success = false, errorCode = "no_update" }); return;
                    }
                    _updateStatus = "downloading";
                    Task.Run(async () => {
                        await Task.Delay(350);
                        var error = Updater.Install(update);
                        _updateStatus = error == null ? "restarting" : "failed";
                        Interlocked.Exchange(ref _installingUpdate, 0);
                    });
                    WriteJson(res, new { success = true, status = "downloading" });
                }
                catch
                {
                    _updateStatus = "failed";
                    Interlocked.Exchange(ref _installingUpdate, 0);
                    WriteJson(res, new { success = false, errorCode = "unavailable" });
                }
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
                        using var rk = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", true);
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
                    catch { res.StatusCode = 500; res.Close(); return; }
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
                if (string.IsNullOrWhiteSpace(folder) || !Directory.Exists(folder))
                { res.StatusCode = 400; res.Close(); return; }
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

            // 2f. YouTube Live Status API (Cached 60s, Zero Quotas)
            if (path.Equals("/api/youtube-live", StringComparison.OrdinalIgnoreCase))
            {
                res.ContentType = "application/json; charset=utf-8";
                var json = GetYouTubeLiveStatusJson();
                var bytes = Encoding.UTF8.GetBytes(json);
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
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "v3", "public", "assets", "chest_fnv1.png"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "chest_fnv1.png"),
                    Path.Combine(Directory.GetCurrentDirectory(), "public", "assets", "chest_fnv1.png"),
                    Path.Combine(Directory.GetCurrentDirectory(), "v3", "public", "assets", "chest_fnv1.png"),
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

                if (TryServeEmbedded(res, "chest_fnv1.png", "image/png")) return;
            }

            // 3b. Serve Nimna Bro Channel Logo
            if (path.Equals("/assets/nimnabrologo.png", StringComparison.OrdinalIgnoreCase) ||
                path.Equals("/nimnabrologo.png", StringComparison.OrdinalIgnoreCase))
            {
                var candidatePaths = new[]
                {
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "public", "assets", "nimnabrologo.png"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "v3", "public", "assets", "nimnabrologo.png"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "nimnabrologo.png"),
                    Path.Combine(Directory.GetCurrentDirectory(), "public", "assets", "nimnabrologo.png"),
                    Path.Combine(Directory.GetCurrentDirectory(), "v3", "public", "assets", "nimnabrologo.png"),
                    Path.Combine(Directory.GetCurrentDirectory(), "nimnabrologo.png"),
                    @"D:\Projects_Codes\Projects_Codes\NB FORTNITE CHEST TRACKER v2\nimnabrologo.png",
                    @"D:\Projects_Codes\Projects_Codes\NB FORTNITE CHEST TRACKER v2\public\assets\nimnabrologo.png"
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

                if (TryServeEmbedded(res, "nimnabrologo.png", "image/png")) return;
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
            if (cleanPath.Contains("..") || cleanPath.Contains('\\') || cleanPath.Contains(':'))
            { res.StatusCode = 400; res.Close(); return; }
            if (string.IsNullOrEmpty(cleanPath) || cleanPath.Equals("index.html", StringComparison.OrdinalIgnoreCase))
            {
                cleanPath = "index.html";
            }
            else if (cleanPath.Equals("overlay", StringComparison.OrdinalIgnoreCase) || cleanPath.Equals("obs", StringComparison.OrdinalIgnoreCase))
            {
                cleanPath = "overlay.html";
            }
            else if (cleanPath.Equals("dashboard", StringComparison.OrdinalIgnoreCase))
            {
                cleanPath = "dashboard.html";
            }
            else if (cleanPath.Equals("overlay-modern", StringComparison.OrdinalIgnoreCase))
            {
                cleanPath = "overlay-modern.html";
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
                    ".woff2" => "font/woff2",
                    ".ttf" => "font/ttf",
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
                        ".woff2" => "font/woff2",
                        ".ttf" => "font/ttf",
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

    private static string GetSnapshotJson(string targetRoom)
    {
        if (_data == null || _config == null || _data.Matches.Count == 0)
        {
            return $"{{\"room\":\"{EscapeJson(targetRoom)}\",\"total\":0,\"lastMatch\":0,\"liveChests\":0,\"base\":null,\"session\":0,\"player\":\"\",\"accounts\":[],\"matches\":[],\"inProgress\":false}}";
        }

        try
        {
            MatchRecord[] matchArray;
            string playerName = "";
            string profileKey = "";
            Profile? cur;
            lock (_data)
            {
                cur = Profiles.Current(_data, _config);
                if (cur != null)
                {
                    playerName = cur.Name;
                    profileKey = cur.Key;
                }
                else
                {
                    playerName = !string.IsNullOrWhiteSpace(_config.Profile) ? _config.Profile : "";
                    profileKey = playerName;
                }
                var view = Profiles.View(_data, _config);
                matchArray = view.Matches.ToArray();
            }

            // Per-profile starting chest count (strictly isolated between accounts)
            var baseCount = _config.GetBaseChestForProfile(profileKey) ?? _config.GetBaseChestForProfile(playerName);
            var matches = matchArray.OrderByDescending(ReportWriter.When).ToList();
            var inProgress = _isLiveInProgress?.Invoke() ?? false;
            var liveMatch = inProgress ? _getLiveMatch?.Invoke() : null;
            var liveChests = liveMatch != null && (Profiles.Key(liveMatch).Equals(profileKey, StringComparison.OrdinalIgnoreCase)
                || string.Equals(liveMatch.PlayerName, playerName, StringComparison.OrdinalIgnoreCase)) ? liveMatch.ChestsOpened : 0;
            var liveDestroyed = liveMatch != null && (Profiles.Key(liveMatch).Equals(profileKey, StringComparison.OrdinalIgnoreCase)
                || string.Equals(liveMatch.PlayerName, playerName, StringComparison.OrdinalIgnoreCase)) ? liveMatch.ChestsDestroyed : 0;

            var sessionMatches = matches.Where(ReportWriter.IsThisSession).ToList();
            var sessionChests = sessionMatches.Sum(m => m.ChestsOpened) + liveChests;
            var sessionDestroyed = sessionMatches.Sum(m => m.ChestsDestroyed) + liveDestroyed;
            var sessionOpened = Math.Max(0, sessionChests - sessionDestroyed);

            var totalChests = matches.Sum(m => m.ChestsOpened) + liveChests;
            var totalDestroyed = matches.Sum(m => m.ChestsDestroyed) + liveDestroyed;

            int displayedTotal;
            lock (_data)
            {
                var baselinesBefore = _config.ProfileBaseReplayTotals.Count;
                displayedTotal = _config.DisplayedChestTotal(profileKey, playerName, totalChests - liveChests, liveChests);
                if (_config.ProfileBaseReplayTotals.Count != baselinesBefore) _store?.SaveConfig(_config);
            }
            var displayedOpened = Math.Max(0, displayedTotal - totalDestroyed);

            var lastMatch = matches.Count > 0 ? matches[0].ChestsOpened : 0;
            var lastMatchDestroyed = matches.Count > 0 ? matches[0].ChestsDestroyed : 0;
            var lastMatchOpened = Math.Max(0, lastMatch - lastMatchDestroyed);
            var baseJson = (baseCount.HasValue && baseCount.Value > 0) ? baseCount.Value.ToString() : "null";

            // Format accounts list (ordered by last played descending)
            var profileItems = Profiles.List(_data).Select(p =>
            {
                var isActive = cur != null && (string.Equals(p.Key, cur.Key, StringComparison.OrdinalIgnoreCase) || string.Equals(p.Name, cur.Name, StringComparison.OrdinalIgnoreCase));
                return $"{{\"key\":\"{EscapeJson(p.Key)}\",\"name\":\"{EscapeJson(p.Name)}\",\"matches\":{p.Matches},\"chests\":{p.Chests},\"active\":{(isActive ? "true" : "false")}}}";
            });
            var accountsJson = "[" + string.Join(",", profileItems) + "]";
            var matchesJson = GetMatchesJson();

            return $"{{\"room\":\"{EscapeJson(targetRoom)}\",\"total\":{displayedTotal},\"opened\":{displayedOpened},\"destroyed\":{totalDestroyed},\"lastMatch\":{lastMatch},\"lastMatchOpened\":{lastMatchOpened},\"lastMatchDestroyed\":{lastMatchDestroyed},\"liveChests\":{liveChests},\"liveDestroyed\":{liveDestroyed},\"base\":{baseJson},\"session\":{sessionChests},\"sessionOpened\":{sessionOpened},\"sessionDestroyed\":{sessionDestroyed},\"player\":\"{EscapeJson(playerName)}\",\"accounts\":{accountsJson},\"matches\":{matchesJson},\"inProgress\":{(inProgress ? "true" : "false")}}}";
        }
        catch
        {
            return $"{{\"room\":\"{EscapeJson(targetRoom)}\",\"total\":0,\"opened\":0,\"destroyed\":0,\"lastMatch\":0,\"lastMatchOpened\":0,\"lastMatchDestroyed\":0,\"liveChests\":0,\"liveDestroyed\":0,\"base\":null,\"session\":0,\"sessionOpened\":0,\"sessionDestroyed\":0,\"player\":\"\",\"accounts\":[],\"matches\":[],\"inProgress\":false}}";
        }
    }

    private static string GetLiveStatsJson()
    {
        string curName = "";
        if (_config != null && _data != null)
        {
            lock (_data)
            {
                var cur = Profiles.Current(_data, _config);
                if (cur != null && !string.IsNullOrWhiteSpace(cur.Name))
                {
                    curName = cur.Name;
                }
            }
        }
        var snapshot = GetSnapshotJson(!string.IsNullOrWhiteSpace(curName) ? curName : "default");
        var options = System.Text.Json.JsonSerializer.Serialize(_config?.OverlayOptions ?? new(), new System.Text.Json.JsonSerializerOptions(System.Text.Json.JsonSerializerDefaults.Web));
        return snapshot[..^1] + ",\"uiLanguage\":\"" + EscapeJson(_config?.UiLanguage ?? _config?.Language ?? "en") + "\",\"overlayOptions\":" + options + "}";
    }

    private static string GetMatchesJson()
    {
        if (_data == null || _config == null || _data.Matches.Count == 0) return "[]";
        try
        {
            MatchRecord[] matchArray;
            string curProfileName = "";
            lock (_data)
            {
                var cur = Profiles.Current(_data, _config);
                if (cur != null && !string.IsNullOrWhiteSpace(cur.Name))
                {
                    curProfileName = cur.Name;
                }
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
                var player = EscapeJson(!string.IsNullOrEmpty(m.PlayerName) ? m.PlayerName : curProfileName);
                return $"{{\"fileName\":\"{EscapeJson(fn)}\",\"matchStart\":\"{start}\",\"durationSeconds\":{m.DurationSeconds ?? 0},\"playlist\":\"{EscapeJson(pl)}\",\"placement\":{place},\"chestsOpened\":{m.ChestsOpened},\"chestsSearched\":{m.ChestsSearchedOnly},\"chestsDestroyed\":{m.ChestsDestroyed},\"eliminations\":{elim},\"playerName\":\"{player}\"}}";
            });
            return "[" + string.Join(",", items) + "]";
        }
        catch { return "[]"; }
    }

    private static void WriteJson(HttpListenerResponse response, object value)
    {
        response.ContentType = "application/json; charset=utf-8";
        response.Headers["Cache-Control"] = "no-store";
        var bytes = System.Text.Json.JsonSerializer.SerializeToUtf8Bytes(value);
        response.ContentLength64 = bytes.Length;
        response.OutputStream.Write(bytes);
        response.Close();
    }

    private static string EscapeJson(string s) => System.Text.Json.JsonSerializer.Serialize(s ?? "")[1..^1];

    public static string CurrentCloudOverlayUrl => "https://nbfct.nimnabro.com/overlay";

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

    private static DateTime _ytLastCheckUtc = DateTime.MinValue;
    private static readonly HttpClient _youtubeClient = new() { Timeout = TimeSpan.FromSeconds(5) };
    private static string _ytCachedStatusJson = "";
    private static readonly object _ytLock = new();

    private static string GetYouTubeLiveStatusJson()
    {
        lock (_ytLock)
        {
            if ((DateTime.UtcNow - _ytLastCheckUtc).TotalSeconds < 60 && !string.IsNullOrEmpty(_ytCachedStatusJson))
            {
                return _ytCachedStatusJson;
            }
        }

        try
        {
            using var reqMsg = new HttpRequestMessage(HttpMethod.Get, "https://www.youtube.com/@nimna_bro_/live");
            reqMsg.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            using var resMsg = _youtubeClient.Send(reqMsg);
            using var reader = new StreamReader(resMsg.Content.ReadAsStream());
            var html = reader.ReadToEnd();

            bool isOffline = html.Contains("LIVE_STREAM_OFFLINE") ||
                             html.Contains("LOGIN_REQUIRED") ||
                             html.Contains("This live stream is not available") ||
                             html.Contains("\"status\":\"UPCOMING\"");

            bool isLive = !isOffline && (
                html.Contains("\"isLiveBroadcast\":true") ||
                (html.Contains("watching now") && html.Contains("\"videoType\":\"VIEW_COUNT_VIDEO_TYPE_LIVE\""))
            );

            string videoId = "WNAE8-0VOLE";
            var vIdx = html.IndexOf("\"videoId\":\"", StringComparison.Ordinal);
            if (vIdx >= 0)
            {
                var start = vIdx + 11;
                var end = html.IndexOf('"', start);
                if (end > start)
                {
                    var id = html.Substring(start, end - start);
                    if (id.Length == 11) videoId = id;
                }
            }

            string title = isLive ? "🔴 Fortnite Live Stream - Nimna Bro" : "Fortnite Highlights & Stream - Nimna Bro";
            var tIdx = html.IndexOf("<title>", StringComparison.OrdinalIgnoreCase);
            if (tIdx >= 0)
            {
                var tEnd = html.IndexOf("</title>", tIdx, StringComparison.OrdinalIgnoreCase);
                if (tEnd > tIdx)
                {
                    var rawTitle = html.Substring(tIdx + 7, tEnd - (tIdx + 7)).Replace(" - YouTube", "").Trim();
                    if (!string.IsNullOrWhiteSpace(rawTitle)) title = rawTitle;
                }
            }

            var jsonResult = $"{{\"isLive\":{(isLive ? "true" : "false")},\"videoId\":\"{EscapeJson(videoId)}\",\"title\":\"{EscapeJson(title)}\",\"channelUrl\":\"https://www.youtube.com/@nimna_bro_\",\"liveUrl\":\"https://www.youtube.com/@nimna_bro_/live\",\"subUrl\":\"https://www.youtube.com/@nimna_bro_?sub_confirmation=1\",\"thumbnail\":\"https://i.ytimg.com/vi/{videoId}/hqdefault.jpg\",\"creatorCode\":\"NIMNABRO\"}}";

            lock (_ytLock)
            {
                _ytLastCheckUtc = DateTime.UtcNow;
                _ytCachedStatusJson = jsonResult;
            }
            return jsonResult;
        }
        catch
        {
            return "{\"isLive\":false,\"videoId\":\"o5pBvr1jqm0\",\"title\":\"Nimna Bro - Fortnite Streams & Content\",\"channelUrl\":\"https://www.youtube.com/@nimna_bro_\",\"liveUrl\":\"https://www.youtube.com/@nimna_bro_/live\",\"subUrl\":\"https://www.youtube.com/@nimna_bro_?sub_confirmation=1\",\"thumbnail\":\"https://i.ytimg.com/vi/o5pBvr1jqm0/hqdefault.jpg\",\"creatorCode\":\"NIMNABRO\"}";
        }
    }
    private static bool TryServeEmbedded(HttpListenerResponse res, string filename, string contentType)
    {
        var asm = typeof(AppInfo).Assembly;
        var resNames = asm.GetManifestResourceNames();
        var matched = resNames.FirstOrDefault(r => r.EndsWith(filename, StringComparison.OrdinalIgnoreCase));
        if (matched != null)
        {
            using var stream = asm.GetManifestResourceStream(matched);
            if (stream != null)
            {
                res.ContentType = contentType;
                res.ContentLength64 = stream.Length;
                stream.CopyTo(res.OutputStream);
                res.Close();
                return true;
            }
        }
        return false;
    }

}
