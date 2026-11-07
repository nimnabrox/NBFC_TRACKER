using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace ChestCounter;

/// <summary>
/// NBFC TRACKER - Modern native desktop window hosting 1:2 layout WebView2 dashboard,
/// with System Tray minimization and quick-action menu.
/// Created by NimnaBro
/// </summary>
public class MainGuiForm : Form
{
    private readonly WebView2 _webView;
    private readonly string _dashboardUrl;
    private readonly Action? _onExit;
    private readonly NotifyIcon _trayIcon;
    private bool _allowExit = false;
    private bool _hasShownTrayNotice = false;

    public static MainGuiForm? CurrentInstance { get; private set; }

    public MainGuiForm(string dashboardUrl, Action? onExit = null, bool startMinimized = false)
    {
        CurrentInstance = this;
        _dashboardUrl = dashboardUrl;
        _onExit = onExit;

        Text = "NBFC TRACKER";
        Size = new Size(540, 720);
        MinimumSize = new Size(460, 560);
        MaximumSize = new Size(700, 920);
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = Color.FromArgb(13, 15, 20);

        if (startMinimized)
        {
            WindowState = FormWindowState.Minimized;
            ShowInTaskbar = false;
            _hasShownTrayNotice = true;
        }

        // Load Icon
        try
        {
            var iconCandidatePaths = new[]
            {
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "src", "ChestCounter", "app.ico"),
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "app.ico"),
                Path.Combine(Directory.GetCurrentDirectory(), "src", "ChestCounter", "app.ico"),
                Path.Combine(Directory.GetCurrentDirectory(), "v3", "public", "assets", "app.ico"),
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "public", "assets", "chest_fnv1.png")
            };

            foreach (var p in iconCandidatePaths)
            {
                if (File.Exists(p))
                {
                    if (p.EndsWith(".ico", StringComparison.OrdinalIgnoreCase))
                    {
                        Icon = new Icon(p);
                    }
                    else
                    {
                        using var bmp = new Bitmap(p);
                        Icon = Icon.FromHandle(bmp.GetHicon());
                    }
                    break;
                }
            }
        }
        catch { /* Fallback to default */ }

        // Setup System Tray Icon & Context Menu
        _trayIcon = new NotifyIcon
        {
            Icon = this.Icon ?? SystemIcons.Application,
            Text = "NBFC TRACKER",
            Visible = true
        };

        var trayMenu = new ContextMenuStrip();
        var openItem = new ToolStripMenuItem("Open Desktop Companion", null, (_, _) => RestoreWindow())
        {
            Font = new Font(Font, FontStyle.Bold)
        };
        var openWebItem = new ToolStripMenuItem("Open Web Dashboard (nbfct.nimnabro.com)", null, (_, _) =>
        {
            try
            {
                Process.Start(new ProcessStartInfo("https://nbfct.nimnabro.com") { UseShellExecute = true });
            }
            catch { }
        });
        var copyOverlayItem = new ToolStripMenuItem("Copy OBS Overlay URL", null, (_, _) =>
        {
            try
            {
                Clipboard.SetText("https://nbfct.nimnabro.com/overlay.html?room=nimnabro");
                _trayIcon.ShowBalloonTip(1500, "NBFC TRACKER", "OBS Overlay URL copied to clipboard!", ToolTipIcon.Info);
            }
            catch { }
        });
        var openOverlayItem = new ToolStripMenuItem("Open Live Overlay", null, (_, _) =>
        {
            try
            {
                Process.Start(new ProcessStartInfo("https://nbfct.nimnabro.com/overlay.html?room=nimnabro") { UseShellExecute = true });
            }
            catch { }
        });
        var exitItem = new ToolStripMenuItem("Exit NBFC TRACKER", null, (_, _) =>
        {
            _allowExit = true;
            Close();
            Application.Exit();
        });

        trayMenu.Items.Add(openItem);
        trayMenu.Items.Add(openWebItem);
        trayMenu.Items.Add(new ToolStripSeparator());
        trayMenu.Items.Add(copyOverlayItem);
        trayMenu.Items.Add(openOverlayItem);
        trayMenu.Items.Add(new ToolStripSeparator());
        trayMenu.Items.Add(exitItem);

        _trayIcon.ContextMenuStrip = trayMenu;
        _trayIcon.DoubleClick += (_, _) => RestoreWindow();

        // Setup WebView2 Control
        _webView = new WebView2
        {
            Dock = DockStyle.Fill,
            BackColor = Color.FromArgb(13, 15, 20)
        };

        Controls.Add(_webView);
        InitWebView();
    }

    private void RestoreWindow()
    {
        ShowInTaskbar = true;
        Show();
        WindowState = FormWindowState.Normal;
        BringToFront();
        Activate();
    }

    private async void InitWebView()
    {
        try
        {
            var userDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "NBFCTracker", "WebView2");
            Directory.CreateDirectory(userDir);
            var env = await CoreWebView2Environment.CreateAsync(null, userDir);
            await _webView.EnsureCoreWebView2Async(env);

            _webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
            _webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
            _webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
            _webView.CoreWebView2.NewWindowRequested += (_, e) =>
            {
                e.Handled = true;
                try
                {
                    Process.Start(new ProcessStartInfo(e.Uri) { UseShellExecute = true });
                }
                catch { }
            };
            _webView.Source = new Uri(_dashboardUrl);
        }
        catch
        {
            // Fallback screen if WebView2 runtime cannot initialize
            Controls.Clear();
            var pnl = new Panel { Dock = DockStyle.Fill, BackColor = Color.FromArgb(13, 15, 20) };
            var lbl = new Label
            {
                Text = "NBFC TRACKER\n\nDashboard is running at:\n" + _dashboardUrl,
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 13, FontStyle.Bold),
                TextAlign = ContentAlignment.MiddleCenter,
                Dock = DockStyle.Fill
            };
            var btn = new Button
            {
                Text = "Open in Web Browser",
                Size = new Size(200, 44),
                Location = new Point((Width - 200) / 2, Height - 140),
                BackColor = Color.FromArgb(245, 166, 35),
                ForeColor = Color.Black,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                Cursor = Cursors.Hand
            };
            btn.Click += (_, _) =>
            {
                try { Process.Start(new ProcessStartInfo(_dashboardUrl) { UseShellExecute = true }); } catch { }
            };
            pnl.Controls.Add(btn);
            pnl.Controls.Add(lbl);
            Controls.Add(pnl);
        }
    }

    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        try
        {
            var logPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "ChestCounter", "trace.log");
            File.AppendAllText(logPath, $"[{DateTime.Now:HH:mm:ss.fff}] [MainGuiForm] OnFormClosing with reason: {e.CloseReason}, allowExit={_allowExit}\r\n");
        }
        catch { }

        if (!_allowExit && e.CloseReason != CloseReason.WindowsShutDown)
        {
            e.Cancel = true;
            Hide();
            if (!_hasShownTrayNotice)
            {
                _hasShownTrayNotice = true;
                _trayIcon.ShowBalloonTip(2500, "NBFC TRACKER", "Running in background! Double-click tray icon or right-click to restore.", ToolTipIcon.Info);
            }
            return;
        }

        try
        {
            _trayIcon.Visible = false;
            _trayIcon.Dispose();
        }
        catch { }

        base.OnFormClosing(e);
        _onExit?.Invoke();
    }

    protected override void OnFormClosed(FormClosedEventArgs e)
    {
        base.OnFormClosed(e);
        if (ReferenceEquals(CurrentInstance, this))
        {
            CurrentInstance = null;
        }
    }
}
