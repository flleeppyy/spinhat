const SpinHatPlugin = require("../classes/SpinHatPlugin");

/**
* Parses a plugin file and returns a SpinHatPlugin object.
* @param {string} pluginPath Path to the plugin
* @returns {SpinHatPlugin} plugin
*/
module.exports = function parsePlugin(pluginPath) {
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