/**
 * @file main.js
 * @description Main file for spinhat. This is the entry point for the application.
 * @namespace fuckinghell
 *
 */

// @ts-nocheck

// reference to node types
/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="./typings/main.d.ts" />

const Module = require("module");
const Electron = require("electron");
const path = require("path");
const asar = require("asar");
const { wrapWebpack } = require("./utils/webpackWrapper");
const SpinHatPlugin = require("./classes/SpinHatPlugin");
const loadPlugins = require("./utils/pluginLoader");
// Import electron devtools
const {
  default: installExtension,
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} = require("electron-devtools-installer");


console.log("We've been injected! Hello from spinhat!");

// @ts-ignore
Electron.safeStorage = {
  encryptString: () => {
    throw new Error("Unavailable");
  },
  decryptString: () => {
    throw new Error("Unavailable");
  },
  isEncryptionAvailable: () => false,
};

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
    // opts.webPreferences.contextIsolation = false;


    opts.webPreferences.preload = require.resolve("../spinhat/webPreload");
    // @ts-ignore
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

const rspResourcesPath = path.join(path.dirname(require.main.filename), "..",);
const rspAsarPath = path.join(path.dirname(require.main.filename), "..", "app.asar");


// @ts-ignore
Electron.app.whenReady().then(() => {
  installExtension(REACT_DEVELOPER_TOOLS)
    .then((name) => console.log(`Added Devtools Extension: ${name}`))
    .catch((error) => console.log("An error occurred:", error));
  installExtension(REDUX_DEVTOOLS)
    .then((name) => console.log(`Added Redux Devtools Extension: ${name}`))
    .catch((error) => console.log("An error occurred:", error));
});


const rcPackage = require(path.join(rspAsarPath, "package.json"));
Electron.app.setName(rcPackage.name);

require.main.filename = path.join(rspAsarPath, "..", "app.asar");

const wrappedMain = wrapWebpack(path.join(rspAsarPath, "build", "electron.js"), "sm", false);

console.log("Loading main");
let failedToLoadMain = false;
try {
  // @ts-ignore
  const mod = new module.constructor();
  mod.paths = module.paths;
  mod._compile(wrappedMain.buffer.toString(), path.join(rspAsarPath, "build", "electron.js"));
} catch (e) {
  failedToLoadMain = true;
  console.error(e);
}

if (failedToLoadMain) {
  console.error("Failed to load main.js. Loading default main.js");
  // @ts-ignore
  Module._load(rspAsarPath, null, true);
  return;
}

global.spinhat = {
  /**
   * @type {{[key: string]: SpinHatPlugin}}
   */
  plugins: {}
};

loadPlugins();

for (const plugin in spinhat.plugins) {
  console.log(plugin)
  if (plugin.patches) {
    pluginPatchesThing: for (const patch of plugin.patches) {
      if (patch.for === "main") {
        modulething: for (const module in sm__webpack_require__.m) {
          const moduleRaw = sm__webpack_require__.m[module].toString();
          console.log(moduleRaw);
          // If our patch is a string
          if (typeof patch.match === "string" && (moduleRaw.indexOf(patch.match) == -1)) {
            continue;
          }

          sm__webpack_require__.m[module] = moduleRaw.replace(patch.moduleMatch, patch.replace);
          break modulething;
        }
      }
    }
  }
}

sm__webpack_require__.load();

