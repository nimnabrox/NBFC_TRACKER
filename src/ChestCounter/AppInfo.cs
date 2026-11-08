namespace ChestCounter;

/// <summary>Created by NimnaBro - App metadata, version and process synchronization.</summary>
public static class AppInfo
{
    public static Version Version { get; } = typeof(AppInfo).Assembly.GetName().Version ?? new Version(0, 1, 0);

    public static string VersionText => $"{Version.Major}.{Version.Minor}.{Math.Max(0, Version.Build)}";
    public const string DisplayVersion = "v0.1.0";

    public const string AppName = "NBFC TRACKER";
    public const string Author = "NimnaBro";
    public const string Repo = "nimnabrox/NBFC_TRACKER";
    public static string RepoUrl => "https://github.com/" + Repo;
    public static string IssuesUrl => RepoUrl + "/issues";
    public const string CreatorUrl = "https://guns.lol/nimnabro";

    /// <summary>Path of executable when running as published exe.</summary>
    public static string? ExePath
    {
        get
        {
            var p = Environment.ProcessPath;
            return p != null && (Path.GetFileName(p).Equals("NBFC TRACKER.exe", StringComparison.OrdinalIgnoreCase) ||
                                Path.GetFileName(p).Equals("NB Fortnite Chest Tracker.exe", StringComparison.OrdinalIgnoreCase) ||
                                Path.GetFileName(p).Equals("ChestCounter.exe", StringComparison.OrdinalIgnoreCase) ||
                                p.EndsWith(".exe", StringComparison.OrdinalIgnoreCase)) ? p : null;
        }
    }

    // Names of the per-user kernel objects that let the processes find each other.
    public static string InstanceMutexFor(string dataDir)
    {
        var hash = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(Path.GetFullPath(dataDir).TrimEnd('\\', '/').ToLowerInvariant()));
        return @"Local\NimnaBro.NBFCTracker.Instance." + Convert.ToHexString(hash, 0, 8);
    }
    public const string StandbyMutex = @"Local\NimnaBro.NBFCTracker.Standby";
    public const string StandbyStopEvent = @"Local\NimnaBro.NBFCTracker.StandbyStop";
}
