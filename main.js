const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

let mainWindow;
let currentFilePath = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: true,
  });

  const distPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadFile('renderer/index.html');
  }

  // Log any renderer-side errors to the terminal
  mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
    console.error('Page load failed:', code, desc);
  });
  mainWindow.webContents.on('render-process-gone', (e, details) => {
    console.error('Renderer crashed:', details.reason);
  });
  mainWindow.webContents.on('console-message', (e, level, msg) => {
    if (level >= 2) console.error('[renderer]', msg); // warnings + errors
  });

  buildMenu();
}

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu-new'),
        },
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }],
              properties: ['openFile'],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              const filePath = result.filePaths[0];
              const content = fs.readFileSync(filePath, 'utf-8');
              currentFilePath = filePath;
              mainWindow.webContents.send('file-opened', { content, filePath });
            }
          },
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('menu-save'),
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow.webContents.send('menu-save-as'),
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle DevTools',
          accelerator: 'F12',
          click: () => mainWindow.webContents.toggleDevTools(),
        },
        { role: 'reload' },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'AI',
      submenu: [
        {
          label: 'Fix Markdown Issues',
          accelerator: 'CmdOrCtrl+Shift+F',
          click: () => mainWindow.webContents.send('ai-fix', 'fix'),
        },
        {
          label: 'Improve Grammar & Style',
          accelerator: 'CmdOrCtrl+Shift+G',
          click: () => mainWindow.webContents.send('ai-fix', 'grammar'),
        },
        {
          label: 'Improve Structure',
          accelerator: 'CmdOrCtrl+Shift+H',
          click: () => mainWindow.webContents.send('ai-fix', 'structure'),
        },
        {
          label: 'Generate Missing Content',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => mainWindow.webContents.send('ai-fix', 'expand'),
        },
        {
          label: 'Convert Plain Text to Markdown',
          click: () => mainWindow.webContents.send('ai-fix', 'convert'),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC: Save file
ipcMain.handle('save-file', async (event, { content, filePath }) => {
  const targetPath = filePath || currentFilePath;
  if (targetPath) {
    fs.writeFileSync(targetPath, content, 'utf-8');
    currentFilePath = targetPath;
    return { success: true, filePath: targetPath };
  }
  return { success: false };
});

// IPC: Save As
ipcMain.handle('save-file-as', async (event, { content }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'Markdown', extensions: ['md'] }],
  });
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, content, 'utf-8');
    currentFilePath = result.filePath;
    return { success: true, filePath: result.filePath };
  }
  return { success: false };
});

// IPC: Ollama AI call
ipcMain.handle('ollama-call', async (event, { prompt, model }) => {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: model || 'qwen2.5:3b',
      prompt,
      stream: false,
      options: {
        temperature: 0.2,
        num_ctx: 8192,
        top_p: 0.9,
      },
    });

    const options = {
      hostname: '127.0.0.1',
      port: 11434,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ success: true, response: json.response });
        } catch (e) {
          resolve({ success: false, error: 'Failed to parse Ollama response: ' + e.message });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ success: false, error: 'Ollama not reachable: ' + e.message });
    });

    req.setTimeout(300000, () => {
      req.destroy();
      resolve({ success: false, error: 'Ollama request timed out after 5 minutes. Try using a faster model like "llama3.2:latest" or "qwen2.5:3b".' });
    });

    req.write(body);
    req.end();
  });
});

// IPC: List Ollama models
ipcMain.handle('ollama-models', async () => {
  return new Promise((resolve) => {
    const options = {
      hostname: '127.0.0.1',
      port: 11434,
      path: '/api/tags',
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const models = (json.models || []).map(m => m.name);
          resolve({ success: true, models });
        } catch (e) {
          resolve({ success: false, models: [] });
        }
      });
    });

    req.on('error', () => {
      resolve({ success: false, models: [] });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ success: false, models: [] });
    });

    req.end();
  });
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
