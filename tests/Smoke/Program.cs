using ChestCounter;
using System.Net;
using System.Text.Json;
using System.Security.Cryptography;

static void Check(bool ok, string message) { if (!ok) throw new Exception(message); Console.WriteLine("PASS " + message); }
if (args.Contains("--verify-private-update"))
{
    Environment.SetEnvironmentVariable("CHESTCOUNTER_UPDATE_API", null);
    var actual = await Updater.CheckDetailedAsync();
    Check(actual.ErrorCode == null && actual.Release != null, "Authenticated private release lookup");
    Check(actual.Release!.Tag == AppInfo.DisplayVersion, "GitHub release and desktop version match");
    Check(!actual.HasUpdate, "Current version correctly reports up to date");
    if (args.Contains("--download"))
    {
        await Updater.DownloadAsync(actual.Release, Path.GetFullPath("dist/private-update-verified.exe"));
        Console.WriteLine("PASS Private release executable downloaded and SHA-256 verified");
    }
    return;
}
Check(AppInfo.VersionText == File.ReadAllText("VERSION").Trim(), "Desktop uses the central VERSION");
var config = new Config();
config.SetBaseChestForProfile("alice", 4084);
Check(config.DisplayedChestTotal("alice", "Alice", 100, 0) == 4084, "Milestone starts without double counting history");
Check(config.DisplayedChestTotal("alice", "Alice", 108, 2) == 4094, "New finished and live chests increment milestone");
Check(config.DisplayedChestTotal("bob", "Bob", 25, 0) == 25, "Profile offsets stay isolated");
config.SetBaseChestForProfile("alice", null);
Check(config.DisplayedChestTotal("alice", "Alice", 108, 0) == 108, "Reset returns to replay total");
config.SetBaseChestForProfile("live", 4100);
config.ProfileBaseReplayTotals["live"] = 100; config.ProfileBaseLiveTotals["live"] = 3;
Check(config.DisplayedChestTotal("live", "Live", 100, 3) == 4100, "Saving a total during a match does not immediately recount existing chests");
Check(config.DisplayedChestTotal("live", "Live", 100, 5) == 4102, "Only newly opened live chests increase the entered total");
Check(config.DisplayedChestTotal("live", "Live", 105, 0) == 4102, "Finalizing the replay preserves the increment without double counting");
foreach (var code in DashboardLanguage.Codes) Check(DashboardLanguage.Set(code) && DashboardLanguage.Text("openApp") != "openApp", "Embedded locale " + code);
DashboardLanguage.Set("en");
Environment.SetEnvironmentVariable("NBFC_DISABLE_CLOUD_SYNC", "1");
Environment.SetEnvironmentVariable("NBFC_PORT", "15088");
var folder = Path.GetFullPath("dist/smoke-data");
var store = new Store(folder);
var data = new TrackerData { Matches = new() {
  new MatchRecord { EpicId = "alice", PlayerName = "Alice\t\"<test>", ChestsOpened = 12, MatchStartUtc = DateTime.UtcNow, Placement = 1 },
  new MatchRecord { EpicId = "bob", PlayerName = "Bob", ChestsOpened = 9, MatchStartUtc = DateTime.UtcNow.AddMinutes(-30) }
} };
config.Profile = "alice";
store.SaveConfig(config);
var liveProgress = false;
var liveFixture = new MatchRecord { EpicId = "alice", PlayerName = "Alice\t\"<test>", ChestsOpened = 3 };
WebDashboardServer.Start(store, config, data, () => liveProgress, () => liveFixture);
Check(WebDashboardServer.IsListening, "Local dashboard listens");
using var http = new HttpClient();
async Task<JsonElement> Get(string path) => JsonDocument.Parse(await http.GetStringAsync(WebDashboardServer.Url + path)).RootElement.Clone();
Check((await Get("api/live")).GetProperty("total").GetInt32() == 12, "Local API uses real profile total");
liveProgress = true;
await Get("api/set-base?count=4100&profile=alice");
Check((await Get("api/live")).GetProperty("total").GetInt32() == 4100,"Entering a total during a live match uses the entered number exactly");
liveFixture.ChestsOpened = 5;
Check((await Get("api/live")).GetProperty("total").GetInt32() == 4102,"Live API adds only chests opened after the starting total was saved");
lock(data) data.Matches.Add(new MatchRecord { EpicId="alice",PlayerName=liveFixture.PlayerName,ChestsOpened=5,MatchStartUtc=DateTime.UtcNow.AddSeconds(1) });
liveProgress = false;
Check((await Get("api/live")).GetProperty("total").GetInt32() == 4102,"Finished replay keeps the same total and ignores stale live data");
await Get("api/set-base?count=4084&profile=alice");
Check((await Get("api/live")).GetProperty("total").GetInt32() == 4084, "Base endpoint applies milestone");
await Get("api/set-profile?key=bob");
Check((await Get("api/live")).GetProperty("total").GetInt32() == 9, "Switching profiles cannot leak totals");
Check((await http.GetAsync(WebDashboardServer.Url + "api/set-base?count=1.5")).StatusCode == HttpStatusCode.BadRequest, "Invalid count rejected");
Check((await http.GetAsync(WebDashboardServer.Url + "api/set-demos-folder?folder=Z%3A%5Cmissing-nbfc-folder")).StatusCode == HttpStatusCode.BadRequest, "Missing folder rejected");
await Get("api/set-language?code=ar");
Check((await Get("api/settings")).GetProperty("uiLanguage").GetString() == "ar", "Native language persists");
Check((await http.GetStringAsync(WebDashboardServer.Url)).Contains("app-layout"), "Original website dashboard serves");
Check((await http.GetStringAsync(WebDashboardServer.Url + "app.html")).Contains("mini-shell"), "Original compact desktop serves");
Check((await http.GetStringAsync(WebDashboardServer.Url + "modern.html")).Contains("app-layout"), "Old dashboard URL keeps the original UI");
Check((await http.GetStringAsync(WebDashboardServer.Url + "overlay")).Contains("chest-halo"), "Local OBS alias serves restored overlay");
Check((await Get("locales/ja.json")).GetProperty("chests").GetString() == "宝箱", "UTF-8 locale serves");
Check((await Get("api/settings")).GetProperty("version").GetString() == AppInfo.DisplayVersion, "Settings API version matches the app");
Check((await Get("version.json")).GetProperty("displayVersion").GetString() == AppInfo.DisplayVersion, "Web manifest and native app use the same version");
using (var direct = new HttpClient(new HttpClientHandler { AllowAutoRedirect = false }))
{
    Check((await direct.GetAsync(WebDashboardServer.Url + "overlay")).StatusCode == HttpStatusCode.OK, "Clean overlay URL serves without an HTML redirect");
    Check((await direct.GetAsync(WebDashboardServer.Url + "overlay-modern")).StatusCode == HttpStatusCode.OK, "Clean modern overlay URL serves directly");
}
Check(!WebDashboardServer.CurrentCloudOverlayUrl.Contains(".html"), "Copied native overlay URL has no .html suffix");
using (var content = new StringContent("{\"showLabel\":true,\"label\":\"Chests opened\",\"showLastMatch\":true}",System.Text.Encoding.UTF8,"application/json"))
    Check((await http.PostAsync(WebDashboardServer.Url+"api/set-overlay-options",content)).IsSuccessStatusCode,"Overlay editor saves through native API");
Check((await Get("api/settings")).GetProperty("overlayOptions").GetProperty("showLastMatch").GetBoolean(),"Overlay editing settings persist");
Check(WebDashboardServer.CurrentCloudOverlayUrl.Contains("label=Chests%20opened")&&WebDashboardServer.CurrentCloudOverlayUrl.Contains("last=1"),"Tray overlay URL includes the edited caption and last-match option");
Check(!(await Get("api/update-status")).GetProperty("installing").GetBoolean(), "Update status starts idle");
Console.WriteLine("All desktop smoke checks passed.");
using var releaseApi = new HttpListener();
releaseApi.Prefixes.Add("http://localhost:15089/"); releaseApi.Start();
Environment.SetEnvironmentVariable("CHESTCOUNTER_UPDATE_API", "http://localhost:15089/");
var checkUpdate = Updater.CheckAsync();
var context = await releaseApi.GetContextAsync();
var release = JsonSerializer.SerializeToUtf8Bytes(new {
    tag_name = "v99.0.0", draft = false, prerelease = false, html_url = AppInfo.RepoUrl,
    assets = new[] {
        new { name = "unrelated.exe", browser_download_url = "https://example.invalid/unrelated.exe", size = 10, digest = "sha256:abcd" },
        new { name = "NBFC.TRACKER.exe", browser_download_url = "https://example.invalid/tracker.exe", size = 42, digest = "sha256:1234" }
    }
});
context.Response.ContentType = "application/json"; await context.Response.OutputStream.WriteAsync(release); context.Response.Close();
var update = await checkUpdate;
Check(update?.Size == 42 && update.Sha256 == "1234", "Updater recognizes GitHub normalized asset name and digest, skips unrelated executables");
async Task<UpdateCheckResult> Lookup(string tag, int status = 200)
{
    var task = Updater.CheckDetailedAsync();
    var request = await releaseApi.GetContextAsync();
    Check(request.Request.Headers["Authorization"] == null, "GitHub credentials are never sent to a fixture host");
    request.Response.StatusCode = status;
    var payload = JsonSerializer.SerializeToUtf8Bytes(new {
        tag_name = tag, draft = false, prerelease = false, html_url = AppInfo.RepoUrl,
        assets = new[] { new { name = "NBFC.TRACKER.exe", browser_download_url = "https://example.invalid/tracker.exe", size = 42, digest = "sha256:1234" } }
    });
    await request.Response.OutputStream.WriteAsync(payload); request.Response.Close(); return await task;
}
Environment.SetEnvironmentVariable("NBFC_GITHUB_TOKEN", "fixture-token-must-stay-local");
Check(!(await Lookup(AppInfo.DisplayVersion)).HasUpdate, "Same version reports up to date");
Check(!(await Lookup("v0.0.9")).HasUpdate, "Older releases do not trigger an update");
Check((await Lookup("v99.0.0", 401)).ErrorCode == "private_access", "Private access errors are distinct from up-to-date results");
Check((await Lookup("v99.0.0", 503)).ErrorCode == "unavailable", "Network server errors are not reported as up to date");
async Task VerifyDownload(byte[] bytes, long size, string sha, bool valid)
{
    var target = Path.GetFullPath("dist/update-download-test.exe");
    var info = new UpdateInfo(new Version(99,0,0), "v99.0.0", "http://localhost:15089/asset", size, sha, AppInfo.RepoUrl);
    var task = Updater.DownloadAsync(info, target);
    var request = await releaseApi.GetContextAsync();
    Check(request.Request.Headers["Authorization"] == null, "Download does not leak GitHub credentials to other hosts");
    Check(request.Request.Headers["Accept"]?.Contains("application/octet-stream") == true, "Binary download requests the executable bytes");
    await request.Response.OutputStream.WriteAsync(bytes); request.Response.Close();
    try { await task; Check(valid && File.Exists(target), "Valid executable download passes size and checksum verification"); }
    catch (IOException) { Check(!valid && !File.Exists(target), "Invalid update is rejected and partial download removed"); }
}
var executable = new byte[] { 77, 90, 1, 2, 3, 4, 5, 6 };
var digest = Convert.ToHexString(SHA256.HashData(executable));
await VerifyDownload(executable, executable.Length, digest, true);
await VerifyDownload(executable, executable.Length, new string('0',64), false);
await VerifyDownload(executable, executable.Length + 1, digest, false);
var invalid = new byte[] { 1, 2, 3, 4 };
await VerifyDownload(invalid, invalid.Length, Convert.ToHexString(SHA256.HashData(invalid)), false);
