using ChestCounter;
using System.Net;
using System.Text.Json;

static void Check(bool ok, string message) { if (!ok) throw new Exception(message); Console.WriteLine("PASS " + message); }
var config = new Config();
config.SetBaseChestForProfile("alice", 4084);
Check(config.DisplayedChestTotal("alice", "Alice", 100, 0) == 4084, "Milestone starts without double counting history");
Check(config.DisplayedChestTotal("alice", "Alice", 108, 2) == 4094, "New finished and live chests increment milestone");
Check(config.DisplayedChestTotal("bob", "Bob", 25, 0) == 25, "Profile offsets stay isolated");
config.SetBaseChestForProfile("alice", null);
Check(config.DisplayedChestTotal("alice", "Alice", 108, 0) == 108, "Reset returns to replay total");
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
WebDashboardServer.Start(store, config, data);
Check(WebDashboardServer.IsListening, "Local dashboard listens");
using var http = new HttpClient();
async Task<JsonElement> Get(string path) => JsonDocument.Parse(await http.GetStringAsync(WebDashboardServer.Url + path)).RootElement.Clone();
Check((await Get("api/live")).GetProperty("total").GetInt32() == 12, "Local API uses real profile total");
await Get("api/set-base?count=4084&profile=alice");
Check((await Get("api/live")).GetProperty("total").GetInt32() == 4084, "Base endpoint applies milestone");
await Get("api/set-profile?key=bob");
Check((await Get("api/live")).GetProperty("total").GetInt32() == 9, "Switching profiles cannot leak totals");
Check((await http.GetAsync(WebDashboardServer.Url + "api/set-base?count=1.5")).StatusCode == HttpStatusCode.BadRequest, "Invalid count rejected");
Check((await http.GetAsync(WebDashboardServer.Url + "api/set-demos-folder?folder=Z%3A%5Cmissing-nbfc-folder")).StatusCode == HttpStatusCode.BadRequest, "Missing folder rejected");
await Get("api/set-language?code=ar");
Check((await Get("api/settings")).GetProperty("uiLanguage").GetString() == "ar", "Native language persists");
Check((await http.GetStringAsync(WebDashboardServer.Url)).Contains("counter-card"), "New dashboard serves");
Check((await Get("locales/ja.json")).GetProperty("chests").GetString() == "宝箱", "UTF-8 locale serves");
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
