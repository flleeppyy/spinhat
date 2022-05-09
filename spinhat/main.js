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
const { readFileSync, writeFileSync } = require("fs");
const asar = require("asar");
const { wrapWebpack } = require("./utils/webpackWrapper");
const SpinHatPlugin = require("./classes/SpinHatPlugin");
const loadPlugins = require("./utils/pluginLoader");
const { installExtensions } = require("./utils/installExtensions");

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
    opts.webPreferences.preload = require.resolve("../spinhat/webPreload");
    opts.webPreferences.webSecurity = false;

    // @ts-ignore
    super(opts, ...args);

    this.webContents.on("did-frame-finish-load", async () => {
      await installExtensions();
      this.webContents.openDevTools({
        mode: "detach",
      });
    });
    Electron.app.whenReady().then(() => {
      // const devwindow = new Electron.BrowserWindow({
      //   title: "Dev stuff",
      //   width: 800,
      //   height: 600,
      //   webPreferences: {
      //     nodeIntegration: true,
      //     contextIsolation: false,
      //     // preload: path.join(__dirname, "preload.js"),
      //     enableRemoteModule: true,
      //     devTools: true,
      //     webSecurity: false,
      //     allowRunningInsecureContent: true,
      //   },
      //   show: true,
      // });
      // devwindow.loadURL("chrome://chrome-urls");
    });
  }

  // Modify the html file and replace the script with our client script
  // usually the script tag is <script defer="defer" src="client.js"></script>
  loadFile(filePath, options) {
    console.info(filePath);
    if (filePath.endsWith("\\client\\index.html")) {
      const file = readFileSync(filePath, "utf-8");
      let newFile = file.replace(
        /<script .*client.js"><\/script>/,
        `<script defer="defer" src="${require.resolve("../spinhat/client")}"></script>`,
      );
      // remove csp header
      newFile = newFile.replace(/<meta http-equiv="Content-Security-Policy" .*segment\.com;"\/>/, "");
      // write file
      writeFileSync(path.join(__dirname, "index.html"), newFile, "utf-8");
      return super.loadFile(path.join(__dirname, "index.html"), options);
    }
    super.loadFile(filePath, options);
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

const rspResourcesPath = path.join(path.dirname(require.main.filename), "..");
const rspAsarPath = path.join(path.dirname(require.main.filename), "..", "app.asar");

// @ts-ignore

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
  plugins: {},
};

loadPlugins();

for (const pluginname in spinhat.plugins) {
  const plugin = spinhat.plugins[pluginname];

  if (plugin.patches) {
    console.log("Patching: " + plugin.patches.length + " patches");
    for (const patch of plugin.patches) {
      if (patch.for === "main") {
        if (patch.moduleMatch && typeof patch.moduleMatch !== "string" && !(patch.moduleMatch instanceof RegExp)) {
          console.error("Invalid moduleMatch for patch: " + patch.module);
          continue;
        }
        for (const moduleId in sm__webpack_require__.m) {
          const moduleRaw = sm__webpack_require__.m[moduleId].toString();
          if (moduleRaw.match(patch.moduleMatch)) {
            const rawPatchedPlugin = moduleRaw.replace(patch.match, patch.replace);
            const wrappedPatchedPlugin = `( ${rawPatchedPlugin} ).apply(this, arguments)`;
            sm__webpack_require__.m[moduleId] = new Function(
              "exports",
              "module",
              "require",
              "__dirname",
              "__filename",
              `${wrappedPatchedPlugin}\n/*# sourceURL=${moduleId}*/`,
            );
            break;
          }
        }
      }
    }
  }
}

sm__webpack_require__.load();
