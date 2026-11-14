const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn, execFile } = require('node:child_process');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
let nextProcess;

const findFreePort = () => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    server.close((error) => error ? reject(error) : resolve(port));
  });
});

const waitForServer = (url, attempts = 100) => new Promise((resolve, reject) => {
  const request = http.get(url, (response) => {
    response.resume();
    if (response.statusCode && response.statusCode < 500) return resolve();
    if (attempts <= 0) return reject(new Error(`El servidor no respondió: ${response.statusCode}`));
    setTimeout(() => waitForServer(url, attempts - 1).then(resolve, reject), 150);
  });
  request.on('error', () => {
    if (attempts <= 0) return reject(new Error('No se pudo iniciar el servidor interno.'));
    setTimeout(() => waitForServer(url, attempts - 1).then(resolve, reject), 150);
  });
});

const listWindowsFontFamilies = async () => {
  const script = [
    "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8",
    "Add-Type -AssemblyName System.Drawing",
    "(New-Object System.Drawing.Text.InstalledFontCollection).Families | ForEach-Object { $_.Name }",
    "Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts' | ForEach-Object { $_.PSObject.Properties | Where-Object { $_.Name -notmatch '^PS' } | ForEach-Object { ($_.Name -replace ' \(TrueType\)| \(OpenType\)| \(All res\)| \(Truetype\)| \(Raster\)$','').Trim() } }",
    "Get-ItemProperty 'HKCU:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts' -ErrorAction SilentlyContinue | ForEach-Object { $_.PSObject.Properties | Where-Object { $_.Name -notmatch '^PS' } | ForEach-Object { ($_.Name -replace ' \(TrueType\)| \(OpenType\)| \(All res\)| \(Truetype\)| \(Raster\)$','').Trim() } }",
  ].join(';');
  const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
  return [...new Set(stdout.split(/\r?\n/).map((name) => name.trim()).filter(Boolean))];
};

const createWindow = async () => {
  const port = await findFreePort();
  const serverEntry = app.isPackaged
    ? path.join(process.resourcesPath, 'server', 'server.js')
    : path.join(app.getAppPath(), '.next', 'standalone', 'server.js');
  nextProcess = spawn(process.execPath, [serverEntry], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', HOSTNAME: '127.0.0.1', PORT: String(port) },
    windowsHide: true,
    stdio: 'ignore',
  });
  const url = `http://127.0.0.1:${port}`;
  await waitForServer(url);
  const window = new BrowserWindow({
    width: 1600,
    height: 980,
    minWidth: 1024,
    minHeight: 680,
    autoHideMenuBar: true,
    title: 'Text Animation',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });
  await window.loadURL(url);
};

ipcMain.handle('desktop-fonts:list', listWindowsFontFamilies);
ipcMain.handle('gpu:feature-status', () => app.getGPUFeatureStatus());

app.whenReady().then(createWindow).catch((error) => {
  console.error(error);
  app.quit();
});

app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => nextProcess?.kill());
