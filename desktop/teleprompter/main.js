const { app, BrowserWindow, ipcMain, desktopCapturer, globalShortcut, screen } = require('electron');
const path = require('path');
const { execFile } = require('child_process');

let win = null;
let clickThrough = false;
let arranged = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 760,
    minWidth: 760,
    minHeight: 440,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    resizable: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.setAlwaysOnTop(true, 'screen-saver');
  win.loadFile('index.html');
  win.once('ready-to-show', () => win.show());
  win.on('closed', () => { win = null; });
}

function sourceHwnd(sourceId) {
  const match = /^window:(\d+):/.exec(String(sourceId || ''));
  return match ? Number(match[1]) : null;
}

function runPowerShell(script, env = {}) {
  return new Promise((resolve, reject) => {
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    execFile('powershell.exe', ['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-EncodedCommand',encoded], {
      windowsHide: true,
      env: { ...process.env, ...env }
    }, (error, stdout, stderr) => {
      if (error) return reject(new Error((stderr || error.message || '').trim()));
      resolve((stdout || '').trim());
    });
  });
}

const win32Prelude = String.raw`
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class NativeWindow {
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
  [DllImport("user32.dll")]
  public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")]
  public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
  [DllImport("user32.dll")]
  public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")]
  public static extern bool SetForegroundWindow(IntPtr hWnd);
}
"@
`;

async function setTargetBounds(hwnd, bounds) {
  const script = win32Prelude + String.raw`
$hwnd = [IntPtr]::new([Int64]$env:TARGET_HWND)
[NativeWindow]::ShowWindow($hwnd, 9) | Out-Null
[NativeWindow]::SetWindowPos($hwnd,[IntPtr]::Zero,[int]$env:TARGET_X,[int]$env:TARGET_Y,[int]$env:TARGET_W,[int]$env:TARGET_H,0x0040) | Out-Null
`;
  await runPowerShell(script, {
    TARGET_HWND: String(hwnd), TARGET_X: String(Math.round(bounds.x)), TARGET_Y: String(Math.round(bounds.y)),
    TARGET_W: String(Math.round(bounds.width)), TARGET_H: String(Math.round(bounds.height))
  });
}

async function getTargetBounds(hwnd) {
  const script = win32Prelude + String.raw`
$hwnd = [IntPtr]::new([Int64]$env:TARGET_HWND)
$r = New-Object NativeWindow+RECT
if([NativeWindow]::GetWindowRect($hwnd,[ref]$r)){ "$($r.Left),$($r.Top),$($r.Right-$r.Left),$($r.Bottom-$r.Top)" }
`;
  const output = await runPowerShell(script, { TARGET_HWND: String(hwnd) });
  const p = output.split(',').map(Number);
  if (p.length !== 4 || p.some(v => !Number.isFinite(v))) return null;
  return { x:p[0], y:p[1], width:p[2], height:p[3] };
}

function setClickThrough(enabled) {
  clickThrough = !!enabled;
  if (win && !win.isDestroyed()) {
    win.setIgnoreMouseEvents(clickThrough, { forward: true });
    win.webContents.send('window:click-through-changed', clickThrough);
  }
  return clickThrough;
}

async function arrangeTarget(sourceId) {
  const hwnd = sourceHwnd(sourceId);
  if (!hwnd) throw new Error('Choose a specific application window first.');

  const display = screen.getDisplayMatching(win.getBounds());
  const work = display.workArea;
  const promptHeight = Math.max(220, Math.min(320, Math.round(work.height * 0.25)));

  if (!arranged || arranged.hwnd !== hwnd) {
    arranged = {
      hwnd,
      sourceId,
      targetBounds: await getTargetBounds(hwnd),
      teleprompterBounds: win.getBounds()
    };
  }

  win.setBounds({ x:work.x, y:work.y, width:work.width, height:promptHeight }, true);
  await setTargetBounds(hwnd, {
    x:work.x,
    y:work.y + promptHeight,
    width:work.width,
    height:work.height - promptHeight
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  return { arranged:true, promptHeight };
}

async function restoreArrangement() {
  if (arranged?.targetBounds) {
    try { await setTargetBounds(arranged.hwnd, arranged.targetBounds); } catch (_) {}
  }
  if (win && arranged?.teleprompterBounds) win.setBounds(arranged.teleprompterBounds, true);
  arranged = null;
  return true;
}

async function sendKeyToTarget(key) {
  if (!arranged?.hwnd) throw new Error('No application window is selected.');
  const keyMap = { next:'{RIGHT}', previous:'{LEFT}', pagedown:'{PGDN}', pageup:'{PGUP}', space:' ' };
  const send = keyMap[key];
  if (!send) throw new Error('Unsupported key.');

  const script = win32Prelude + String.raw`
$hwnd = [IntPtr]::new([Int64]$env:TARGET_HWND)
[NativeWindow]::SetForegroundWindow($hwnd) | Out-Null
Start-Sleep -Milliseconds 60
$ws = New-Object -ComObject WScript.Shell
$ws.SendKeys($env:SEND_KEY)
`;
  await runPowerShell(script, { TARGET_HWND:String(arranged.hwnd), SEND_KEY:send });
  win?.setAlwaysOnTop(true, 'screen-saver');
  return true;
}

app.whenReady().then(() => {
  createWindow();
  globalShortcut.register('CommandOrControl+Shift+T', () => setClickThrough(!clickThrough));

  ipcMain.handle('sources:list', async () => {
    const sources = await desktopCapturer.getSources({
      types:['window','screen'], thumbnailSize:{width:320,height:180}, fetchWindowIcons:true
    });
    return sources.map(source => ({
      id:source.id,
      name:source.name,
      displayId:source.display_id || '',
      thumbnail:source.thumbnail?.toDataURL() || '',
      appIcon:source.appIcon?.toDataURL() || ''
    }));
  });

  ipcMain.handle('window:click-through', (_e, enabled) => setClickThrough(enabled));
  ipcMain.handle('window:arrange-target', (_e, sourceId) => arrangeTarget(sourceId));
  ipcMain.handle('window:restore-target', () => restoreArrangement());
  ipcMain.handle('window:send-key', (_e, key) => sendKeyToTarget(key));
  ipcMain.handle('window:minimise', () => { win?.minimize(); return true; });
  ipcMain.handle('window:toggle-maximise', () => {
    if (!win) return false;
    if (win.isMaximized()) win.unmaximize(); else win.maximize();
    return win.isMaximized();
  });
  ipcMain.handle('window:close', () => { win?.close(); return true; });
});

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
