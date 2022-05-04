const { Module } = require("module");
const {readFileSync, readdirSync, fstat, writeFileSync} = require("fs");
const path = require("path");
const SpinHatPlugin = require("./classes/SpinHatPlugin");
const { contextBridge } = require("electron");

global.spinhat = {
  plugins: {},
}
const preloadPath = path.join(window.location.pathname.slice(1), "../../preload.js");
const clientPath = path.join(window.location.pathname.slice(1), "./client");

/**
 *
 * @param {string} pluginPath Path to the plugin
 * @returns {SpinHatPlugin} plugin
 */

function parsePlugin(pluginPath) {
  /**
   * @type {SpinHatPlugin}
   */
  const plugin = require(pluginPath.replace(/\.js$/, ""));

  if (!SpinHatPlugin.isPrototypeOf(plugin)) {
    throw new Error(`Plugin is not a valid spinhat plugin`);
  }

  // @ts-ignore
  const pluginInstance = new plugin();

  if (!pluginInstance.name || pluginInstance.name === "" || pluginInstance.name === SpinHatPlugin.name) {
    throw new Error("Plugin must have a name");
  }

  if (!pluginInstance.description) {
    throw new Error("Plugin must have a description");
  }

  if (!pluginInstance.author) {
    throw new Error("Plugin must have an author");
  }

  if (pluginInstance.patches) {
    for (const patch of pluginInstance.patches) {
      if (!patch.for) {
        throw new Error("Patch must have a for property");
      }

      if (!patch.match) {
        throw new Error("Patch must have a match property");
      }

      if (!patch.replace) {
        throw new Error("Patch must have a replace property");
      }

      // if the match is not a string or regexp, throw an error
      if (typeof patch.match !== "string" && !(patch.match instanceof RegExp)) {
        throw new Error("Patch match must be a string or regexp");
      }

      // if the replace is not a string or function, throw an error
      if (typeof patch.replace !== "string" && typeof patch.replace !== "function") {
        throw new Error("Patch replace must be a string or function");
      }
    }
  }

  if (pluginInstance.onDOMReady && typeof pluginInstance.onDOMReady !== "function") {
    throw new Error("onDOMReady must be a function");
  }

  if (pluginInstance.onLoad && typeof pluginInstance.onLoad !== "function") {
    throw new Error("onLoad must be a function");
  }

  return pluginInstance;
}

/**
 * @type {SpinHatPlugin[]}
 */
const plugins = (() => {
  const plugins = {};
  const pluginsPath = path.join(__dirname, "plugins");
  const pluginFiles = readdirSync(pluginsPath);
  for (const pluginFile of pluginFiles) {

    const pluginPath = path.resolve(pluginsPath,pluginFile);
    if (pluginFile.endsWith(".js")) {
      try {
        // plugins.push(parsePlugin(pluginPath));
        plugins[pluginPath.replace(/\.js/, "")] = parsePlugin(pluginPath);
      } catch (e) {
        console.error(`Error loading plugin ${pluginPath}: ${e.message}`);
      }
    }
  }
  return plugins;
})();


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

for (const plugin of plugins) {
  if (plugin.patches) {
    patches.push(...plugin.patches);
  }
  if (plugin.onLoad) {
    onLoad(plugin.onLoad);
  }

  if (plugin.onDOMReady) {
    onDOMReady(plugin.onDOMReady);
  }
}

// Read the file as a string
let webpreloadScript = readFileSync(preloadPath, "utf8");
let clientScript = readFileSync(clientPath, "utf8");

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
global.spinhat.getClientScript = () => {
  return clientScript;
}

// Replace script tag that links to client.js, to our own client.js
window.onload = () => {
  // get script where defer = "defer" and src ="client.js"
  const script = document.querySelector("script[defer][src='client.js']");



}

contextBridge.exposeInMainWorld("spinhat", global.spinhat);
// execute the patched code. probably a terrible idea but oh well it kinda doesnt matter
try {
  var m = new module.constructor();
  m.paths = module.paths;
  m._compile(webpreloadScript, preloadPath);
} catch (e) {
  console.error("Error during webPreload", e);
}