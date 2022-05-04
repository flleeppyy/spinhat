//@ts-check

// reference to node types
/// <reference path="../node_modules/@types/node/index.d.ts" />

const Module = require("module");
const Electron = require("electron");
const path = require("path");

console.log("We've been injected! Hello from spinhat!");

Electron.safeStorage = {
  encryptString: () => {
    throw new Error("Unavailable");
  },
  decryptString: () => {
    throw new Error("Unavailable");
  },
  isEncryptionAvailable: () => false,
};

console.log(process.versions);

// WHY THE FUCK IS EVERYTHING IN THE CLIENT WEBPACK BUNDLED

// Replace the BrowserWindow constructor
class BrowserWindow extends Electron.BrowserWindow {
  /**
   *
   * @param {Electron.BrowserWindowConstructorOptions} opts
   * @param  {...any} args
   */
  constructor(opts, ...args) {
    // super({
    //   width: 1200,
    //   height: 1000,
    //   minHeight: 700,
    //   minWidth: 1200,
    //   center: true,
    //   transparent: false,
    //   backgroundColor: "#f0e8da",
    //   webPreferences: {
    //     contextIsolation: true,
    //     enableRemoteModule: false,
    //     nodeIntegration: false,
    //     worldSafeExecuteJavaScript: true,
    //     preload: "C:\\Users\\Chen\\AppData\\Local\\Programs\\reason-plus-companion-app\\resources\\app.asar\\build\\preload.js",
    //   },
    //   show: true,
    // });

    opts.webPreferences.devTools = true;
    opts.webPreferences.worldSafeExecuteJavaScript = false;
    opts.webPreferences.nodeIntegration = true;
    opts.webPreferences.enableRemoteModule = true;

    opts.webPreferences.preload = require.resolve("../spinhat/webPreload");
    super(opts, ...args);


    this.webContents.on("did-finish-load", () => {
      this.webContents.openDevTools({
        mode: "detach",
      });
    });
  }
}

// create a new proxy
const electronProxy = new Proxy(Electron, {
  get(target, name) {
    if (name === "BrowserWindow") {
      return BrowserWindow;
    }
    return target[name];
  },
});

delete require.cache[require.resolve("electron")].exports;
require.cache[require.resolve("electron")].exports = electronProxy;

const rcPath = path.join(path.dirname(require.main.filename), "..", "app.asar");

// Import electron devtools
const {
  default: installExtension,
  REACT_DEVELOPER_TOOLS,
} = require("electron-devtools-installer");
const { electron } = require("process");
Electron.app.whenReady().then(() => {
  installExtension(REACT_DEVELOPER_TOOLS)
    .then((name) => console.log(`Added Devtools Extension: ${name}`))
    .catch((error) => console.log("An error occurred:", error));
});

// Load the app
console.log("Loading Reason+ Companion");

const rcPackage = require(path.join(rcPath, "package.json"));
Electron.app.setName(rcPackage.name);
Electron.app.setPath(rcPath);


require.main.filename = path.join(rcPath, "..", "app.asar");

Module._load(rcPath, null, true);

