// main.js
// const { app, BrowserWindow, desktopCapturer, session } = require('electron')

// app.whenReady().then(() => {
//   const mainWindow = new BrowserWindow() 
//   session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
//     desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
//       // Grant access to the first screen found.
//       callback({ video: sources[0], audio: 'loopback' })
//     }) 
//   }, { useSystemPicker: true })

//   mainWindow.loadFile('index.html')
// })



const { app, BrowserWindow, desktopCapturer, session } = require('electron')

app.whenReady().then(() => {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // Open DevTools when app starts
  // mainWindow.webContents.openDevTools()

  // Set media access
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
      callback({ video: sources[0], audio: 'loopback' })
    })
  }, { useSystemPicker: true })

  mainWindow.loadFile('index.html')
})

