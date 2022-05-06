const pluginParser = require("./pluginParser");
const path = require("path");
const { readdirSync } = require("fs");

module.exports = function loadPlugins() {
  // @ts-ignore
  const pluginsPath = path.join(__dirname, "..", "plugins");
  const pluginFiles = readdirSync(pluginsPath);
  for (const pluginFile of pluginFiles) {
    const pluginPath = path.resolve(pluginsPath,pluginFile);
    if (pluginFile.endsWith(".js")) {
      try {
        spinhat.plugins[pluginPath.replace(/\.js/, "")] = pluginParser(pluginPath);
      } catch (e) {
        console.error(`Error loading plugin ${pluginPath}: ${e.message}`);
      }
    }
  }
}