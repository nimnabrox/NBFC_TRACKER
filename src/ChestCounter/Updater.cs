using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text.Json;

namespace ChestCounter;

public sealed record UpdateInfo(Version Version, string Tag, string AssetUrl, long Size, string? Sha256, string PageUrl, string? Changelog = null, string? ApiAssetUrl = null);
public sealed record UpdateCheckResult(UpdateInfo? Release, bool HasUpdate, string? ErrorCode = null, string? Error = null);

public static class Updater
{
    public static string? LastCheckError { get; private set; }
    private static string ApiUrl => Environment.GetEnvironmentVariable("CHESTCOUNTER_UPDATE_API")
        ?? $"https://api.github.com/repos/{AppInfo.Repo}/releases/latest";

    private static bool IsRepositoryApi(Uri uri) => uri.Scheme == "https" && uri.Host.Equals("api.github.com", StringComparison.OrdinalIgnoreCase)
        && uri.AbsolutePath.StartsWith($"/repos/{AppInfo.Repo}/", StringComparison.OrdinalIgnoreCase);

    // Uses an existing GitHub sign-in without prompting or persisting credentials in the app.
    private static async Task<string?> GitHubTokenAsync()
    {
        var configured = Environment.GetEnvironmentVariable("NBFC_GITHUB_TOKEN");
        if (!string.IsNullOrWhiteSpace(configured)) return configured.Trim();
        try
        {
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(4));
            var start = new ProcessStartInfo("git", "credential fill")
            {
                UseShellExecute = false, CreateNoWindow = true, WindowStyle = ProcessWindowStyle.Hidden,
                RedirectStandardInput = true, RedirectStandardOutput = true, RedirectStandardError = true
            };
            start.Environment["GIT_TERMINAL_PROMPT"] = "0";
            start.Environment["GCM_INTERACTIVE"] = "never";
            using var process = Process.Start(start);
            if (process == null) return null;
            try
            {
                var output = process.StandardOutput.ReadToEndAsync(timeout.Token);
                var errors = process.StandardError.ReadToEndAsync(timeout.Token);
                await process.StandardInput.WriteAsync($"protocol=https\nhost=github.com\npath={AppInfo.Repo}.git\n\n");
                process.StandardInput.Close();
                await process.WaitForExitAsync(timeout.Token);
                var text = await output; await errors;
                if (process.ExitCode != 0) return null;
                return text.Split('\n').FirstOrDefault(line => line.StartsWith("password=", StringComparison.Ordinal))?[9..].Trim();
            }
            catch { try { process.Kill(entireProcessTree: true); } catch { } return null; }
        }
        catch { return null; }
    }

    private static HttpClient NewClient(TimeSpan timeout, bool binary = false)
    {
        var http = new HttpClient { Timeout = timeout };
        http.DefaultRequestHeaders.UserAgent.ParseAdd($"NBFCTracker/{AppInfo.VersionText}");
        http.DefaultRequestHeaders.Accept.ParseAdd(binary ? "application/octet-stream" : "application/vnd.github+json");
        return http;
    }

    private static async Task<HttpResponseMessage> GetAsync(HttpClient http, Uri uri, HttpCompletionOption completion, CancellationToken cancellation = default)
    {
        var response = await http.GetAsync(uri, completion, cancellation);
        // Public repositories work without Git or a sign-in. Retry with existing access only when needed.
        if (IsRepositoryApi(uri) && response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden or HttpStatusCode.NotFound)
        {
            var token = await GitHubTokenAsync();
            if (!string.IsNullOrWhiteSpace(token))
            {
                response.Dispose();
                http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                response = await http.GetAsync(uri, completion, cancellation);
            }
        }
        return response;
    }

    public static async Task<UpdateInfo?> CheckAsync()
    {
        var result = await CheckDetailedAsync();
        return result.HasUpdate ? result.Release : null;
    }

    public static async Task<UpdateCheckResult> CheckDetailedAsync()
    {
        LastCheckError = null;
        UpdateCheckResult Failed(string code, string message)
        {
            LastCheckError = message;
            return new(null, false, code, message);
        }
        try
        {
            var uri = new Uri(ApiUrl);
            using var http = NewClient(TimeSpan.FromSeconds(10));
            using var response = await GetAsync(http, uri, HttpCompletionOption.ResponseContentRead);
            if (!response.IsSuccessStatusCode)
            {
                var code = response.StatusCode == HttpStatusCode.Unauthorized ? "private_access"
                    : response.StatusCode == HttpStatusCode.NotFound ? (http.DefaultRequestHeaders.Authorization == null ? "private_access" : "release_missing")
                    : response.StatusCode == HttpStatusCode.Forbidden ? (response.Headers.TryGetValues("X-RateLimit-Remaining", out var values) && values.Contains("0") ? "rate_limited" : "private_access")
                    : "unavailable";
                return Failed(code, $"GitHub release lookup returned HTTP {(int)response.StatusCode}.");
            }
            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            var root = doc.RootElement;
            if (root.TryGetProperty("draft", out var draft) && draft.GetBoolean()
                || root.TryGetProperty("prerelease", out var pre) && pre.GetBoolean())
                return Failed("release_missing", "No stable release is available.");
            var tag = root.GetProperty("tag_name").GetString() ?? "";
            if (!Version.TryParse(tag.TrimStart('v', 'V'), out var version)) return Failed("unavailable", "Invalid release version.");
            var body = root.TryGetProperty("body", out var b) ? b.GetString() ?? "" : "";
            foreach (var asset in root.GetProperty("assets").EnumerateArray())
            {
                var name = asset.GetProperty("name").GetString() ?? "";
                if (!new[] { "NBFC TRACKER.exe", "NBFC.TRACKER.exe", "ChestCounter.exe" }.Contains(name, StringComparer.OrdinalIgnoreCase)) continue;
                var size = asset.GetProperty("size").GetInt64();
                if (size < 2) continue;
                string? sha = null;
                if (asset.TryGetProperty("digest", out var digest) && digest.GetString() is { } d && d.StartsWith("sha256:", StringComparison.OrdinalIgnoreCase)) sha = d[7..];
                var assetUrl = asset.GetProperty("browser_download_url").GetString()!;
                var apiAssetUrl = asset.TryGetProperty("url", out var assetApi) ? assetApi.GetString() : null;
                var page = root.TryGetProperty("html_url", out var pageUrl) ? pageUrl.GetString() ?? AppInfo.RepoUrl : AppInfo.RepoUrl;
                var release = new UpdateInfo(version, tag, assetUrl, size, sha, page, body, apiAssetUrl);
                return new(release, Normalize(version) > Normalize(AppInfo.Version));
            }
            return Failed("release_missing", "The release has no tracker executable.");
        }
        catch (Exception ex) { return Failed("unavailable", ex.Message); }
    }

    private static Version Normalize(Version v) => new(v.Major, v.Minor, Math.Max(0, v.Build));

    public static async Task DownloadAsync(UpdateInfo update, string destination)
    {
        using var timeout = new CancellationTokenSource(TimeSpan.FromMinutes(5));
        var uri = Uri.TryCreate(update.ApiAssetUrl, UriKind.Absolute, out var api) && IsRepositoryApi(api) ? api : new Uri(update.AssetUrl);
        using var http = NewClient(TimeSpan.FromMinutes(5), binary: true);
        try
        {
            using (var response = await GetAsync(http, uri, HttpCompletionOption.ResponseHeadersRead, timeout.Token))
            {
                response.EnsureSuccessStatusCode();
                using var source = await response.Content.ReadAsStreamAsync(timeout.Token);
                using var target = File.Create(destination);
                await source.CopyToAsync(target, timeout.Token);
            }
            var info = new FileInfo(destination);
            if (info.Length != update.Size) throw new IOException("Incomplete update download.");
            using var file = File.OpenRead(destination);
            if (!string.IsNullOrWhiteSpace(update.Sha256))
            {
                if (!Convert.ToHexString(SHA256.HashData(file)).Equals(update.Sha256, StringComparison.OrdinalIgnoreCase))
                    throw new IOException("The update checksum does not match the GitHub release.");
                file.Position = 0;
            }
            if (file.ReadByte() != 'M' || file.ReadByte() != 'Z') throw new IOException("The update is not a Windows executable.");
        }
        catch { try { File.Delete(destination); } catch { } throw; }
    }

    public static string? Install(UpdateInfo update)
    {
        var exe = AppInfo.ExePath ?? Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "NBFC TRACKER.exe");
        var download = exe + ".download";
        var old = exe + ".old";
        var replaced = false;
        try
        {
            DownloadAsync(update, download).GetAwaiter().GetResult();
            if (File.Exists(old)) File.Delete(old);
            File.Move(exe, old);
            File.Move(download, exe); replaced = true;
            var restart = new ProcessStartInfo(exe) { UseShellExecute = false, WorkingDirectory = Path.GetDirectoryName(exe) ?? Environment.CurrentDirectory };
            restart.ArgumentList.Add("--after-update");
            foreach (var argument in Environment.GetCommandLineArgs().Skip(1).Where(arg => arg != "--after-update")) restart.ArgumentList.Add(argument);
            if (Process.Start(restart) == null) throw new IOException("The updated app could not be started.");
            Environment.Exit(0);
            return null;
        }
        catch (Exception ex)
        {
            try { File.Delete(download); } catch { }
            if (replaced && File.Exists(old)) { try { File.Delete(exe); File.Move(old, exe); } catch { } }
            if (!File.Exists(exe) && File.Exists(old)) { try { File.Move(old, exe); } catch { } }
            return ex.Message;
        }
    }

    public static void CleanupOld()
    {
        var exe = AppInfo.ExePath;
        if (exe == null) return;
        foreach (var suffix in new[] { ".old", ".download" }) { try { File.Delete(exe + suffix); } catch { } }
    }
}
