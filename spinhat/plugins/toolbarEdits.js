const SpinHatPlugin = require("../classes/SpinHatPlugin");

module.exports = class ToolbarEdits extends SpinHatPlugin {
  name = "Toolbar Edits";
  description = "Adds some buttons to the toolbar like devtools.";
  author = "Flleeppyy";

  patches = [
    {
      for: "main",
      moduleMatch: /{role:"reload"},{type:"separator"},{role:"togglefullscreen"}/,
      match: /{role:"reload"},/,
      replace: (original) => {
        return original + `{role:"toggledevtools"},`
      },
    },
  ];
}