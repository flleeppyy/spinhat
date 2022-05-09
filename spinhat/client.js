/**
 * @name client.js
 * @description Client code that's inserted into the page.
 */

// I swear to god this is what i have to do to make this work
eval(new TextDecoder("utf-8").decode(spinhat.getClientScript().buffer));

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
