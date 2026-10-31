const { app, BrowserWindow, session, ipcMain, shell } = require('electron')
const path = require('path')
const { ElectronBlocker } = require('@ghostery/adblocker-electron')
const fetch = require('cross-fetch')

// Check if running in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow = null

// Trusted hosts for streaming providers, metadata, and local assets
const TRUSTED_HOSTS = [
  'localhost',
  '127.0.0.1',
  'vidlink.pro',
  'vidsrc.to',
  'vidsrc.pm',
  'vidsrc.sh',
  'multiembed.mov',
  '2embed.cc',
  'themoviedb.org',
  'tmdb.org',
  'api.themoviedb.org',
  'image.tmdb.org',
]

// Known malicious ad and popup domains to block unconditionally
const BLOCKED_DOMAINS = [
  'ay267.com',
  'onclick',
  'popads',
  'adsterra',
  'trafficjunky',
  'syndication',
  'exoclick',
  'propellerads',
  'bet365',
  '1xbet',
]

function isTrustedUrl(urlStr) {
  try {
    const parsed = new URL(urlStr)
    if (parsed.protocol === 'file:') return true
    return TRUSTED_HOSTS.some((host) => parsed.hostname === host || parsed.hostname.endsWith('.' + host))
  } catch (e) {
    return false
  }
}

function isBlockedAdUrl(urlStr) {
  const lower = urlStr.toLowerCase()
  return BLOCKED_DOMAINS.some((domain) => lower.includes(domain))
}

async function setupAdBlocker() {
  try {
    const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch)
    blocker.enableBlockingInSession(session.defaultSession)
    console.log('[NeroStream Desktop] Ad & Tracking Blocker successfully initialized.')
  } catch (err) {
    console.warn('[NeroStream Desktop] Could not initialize prebuilt ad blocker, using native request filter fallback:', err)
  }

  // Native network request filter fallback / complement
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const url = details.url

    // Always block known spam ad networks
    if (isBlockedAdUrl(url)) {
      console.log('[NeroStream Desktop] BLOCKED ad request:', url)
      return callback({ cancel: true })
    }

    callback({ cancel: false })
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: 'Nero Stream',
    backgroundColor: '#020617', // Slate-950 to match app theme
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  })

  // Smooth window reveal once content is ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // 1. POPUP BLOCKER: Block 100% of popup windows and external tab spawns
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.log('[NeroStream Desktop] Blocked popup / window.open attempt:', url)

    // If user explicitly clicked an external help/info link, open safely in system browser
    if (url.includes('themoviedb.org') || url.includes('github.com')) {
      shell.openExternal(url)
    }

    return { action: 'deny' }
  })

  // 2. TOP-FRAME REDIRECT GUARD: Prevent iframes from hijacking the main application window
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isDev && url.startsWith('http://localhost:5173')) {
      return // Allow Vite dev server
    }

    if (url.startsWith('file://')) {
      return // Allow local production build
    }

    // Block any external attempt to redirect the top-level app window
    event.preventDefault()
    console.log('[NeroStream Desktop] Blocked top-level redirect hijack to:', url)
  })

  // 3. Forward fullscreen events to renderer
  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('fullscreen-change', true)
  })

  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('fullscreen-change', false)
  })

  // Load app: Dev server or production local build
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else if (isDev) {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      // Fallback to local file if dev server is not running
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// IPC Window Controls
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize()
})

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  }
})

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close()
})

ipcMain.on('window-toggle-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen())
  }
})

ipcMain.handle('window-is-fullscreen', () => {
  return mainWindow ? mainWindow.isFullScreen() : false
})

// App Lifecycle
app.whenReady().then(async () => {
  await setupAdBlocker()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
