const { readFileSync, readdirSync, fstat, writeFileSync } = require("fs");
const path = require("path");
const SpinHatPlugin = require("./classes/SpinHatPlugin");
const { contextBridge } = require("electron");
const { wrapWebpack } = require("./utils/webpackWrapper");
const loadPlugins = require("./utils/pluginLoader");

const baseAsarPath = path.join(process.cwd(), "resources", "app.asar");
const preloadFilePath = path.join(baseAsarPath, "build", "preload.js");
const clientFilePath = path.join(baseAsarPath, "build", "client", "client.js");


global.spinhat = {
  plugins: {},
};

loadPlugins();

function onDOMReady(callback) {
  if (document.readyState && document.readyState !== "loading") {
    callback();
  } else if (document.location.href === "about:blank") {
    setTimeout(() => {
      onDOMReady(callback);
    });
  } else {
    document.addEventListener("DOMContentLoaded", callback);
  }
}

function onLoad(callback) {
  if (document.readyState && document.readyState !== "loading") {
    callback();
  } else {
    window.addEventListener("load", callback);
  }
}
/**
 * @type {patch[]}
 */
let patches = [];

for (const plugin in spinhat.plugins) {
  /**
   * @type {SpinHatPlugin}
   */
  const pluginInstance = spinhat.plugins[plugin];

  if (pluginInstance.onLoad) {
    onLoad(pluginInstance.onLoad);
  }

  if (pluginInstance.onDOMReady) {
    onDOMReady(pluginInstance.onDOMReady);
  }

  if (pluginInstance.patches) {
    for (const patch of pluginInstance.patches) {
      if (patch.for !== "main") {
        patches.push(...pluginInstance.patches);
      }
    }
  }
}

// Read the file as a string
// let webpreloadScript = readFileSync(preloadFilePath, "utf8");
// let clientScript = readFileSync(clientFilePath, "utf8");

let webpreloadScript = wrapWebpack(preloadFilePath, "wp", false);
let clientScript = wrapWebpack(clientFilePath, "sm", false);

spinhat.getClientScript = () => clientScript;

contextBridge.exposeInMainWorld("spinhat", global.spinhat);

// execute the patched code. probably a terrible way to load this but oh well it kinda doesnt matter
try {
  var m = new module.constructor();
  m.paths = module.paths;
  m._compile(webpreloadScript.buffer, preloadFilePath);
} catch (e) {
  console.error("Error during webPreload", e);
}

// console.log(wp__webpack_require__);
for (const patch of patches) {
  if (patch.for === "webpreload") {
    if (patch.moduleMatch && (typeof patch.moduleMatch !== "string" && !(patch.moduleMatch instanceof RegExp))) {
      console.error("Invalid moduleMatch for patch: " + patch.module);
      continue;
    }
    for (const moduleId in wp__webpack_require__.m) {
      const moduleRaw = wp__webpack_require__.m[moduleId].toString();
      if (moduleRaw.match(patch.moduleMatch)) {
        const rawPatchedPlugin = moduleRaw.replace(patch.match, patch.replace);
        const wrappedPatchedPlugin = `( ${rawPatchedPlugin} ).apply(this, arguments) //# sourceURL=${moduleId}`;
        wp__webpack_require__.m[moduleId] = new Function(`${wrappedPatchedPlugin}`);
        break;
      } else {
        // Wrap the module in a function
        const wrappedPatchedPlugin = `( ${moduleRaw} ).apply(this, arguments) //# sourceURL=${moduleId}`;
        wp__webpack_require__.m[moduleId] = new Function(`${wrappedPatchedPlugin}`);
      }
    }
  }
}

wp__webpack_require__.load();


