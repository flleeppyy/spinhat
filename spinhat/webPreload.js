const {readFileSync, readdirSync, fstat, writeFileSync} = require("fs");
const path = require("path");
const SpinHatPlugin = require("./classes/SpinHatPlugin");
const { contextBridge } = require("electron");
const { wrapWebpack } = require("./utils/webpackWrapper");
const loadPlugins = require("./utils/pluginLoader");

const preloadFilePath = path.join(window.location.pathname.slice(1), "../../preload.js");
const clientFilePath = path.join(window.location.pathname.slice(1), "../client.js");

global.spinhat = {
  plugins: {},
  loadedPlugins: {},
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

let webpreloadScript = wrapWebpack(preloadFilePath, "", true);
let clientScript = wrapWebpack(clientFilePath, "sm", false);
// Apply patches
patches.forEach(patch => {
  console.log(patch);
  if (patch.for === "webpreload") {
    // const match = preload.match(patch.match);
    webpreloadScript = webpreloadScript.replace(patch.match, patch.replace);
  }
  else if (patch.for === "client") {
    clientScript = clientScript.replace(patch.match, patch.replace);
  }
});

// I have no idea if I'm doing this right
spinhat.getClientScript = () => {
  return clientScript;
}

// Replace script tag that links to client.js, to our own client.js
document.onload = () => {
  // get script where defer = "defer" and src ="client.js"
  const script = document.querySelector("script[defer][src='client.js']");
  // replace src with our own client.js
  script.src = path.join(__dirname, "client.js");
}

contextBridge.exposeInMainWorld("spinhat", global.spinhat);
// execute the patched code. probably a terrible idea but oh well it kinda doesnt matter
try {
  var m = new module.constructor();
  m.paths = module.paths;
  m._compile(webpreloadScript.buffer, preloadFilePath);
} catch (e) {
  console.error("Error during webPreload", e);
}