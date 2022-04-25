// where to start....
// hmmmmm

const electron = require("electron");

function inject(asar) {
  global.spinHat = {
    hello: "hihi",
  };

  // Replace the BrowserWindow constructor
  class BrowserWindow extends electron.BrowserWindow {
    /**
     *
     * @param {Electron.BrowserWindowConstructorOptions} opts
     * @param  {...any} args
     */
    constructor(opts, ...args) {
      opts.webPreferences.devTools = true;
      super(opts, ...args);
      this.webContents.executeJavaScript("alert('hi')");
    }
  }

  Object.assign(BrowserWindow, electron.BrowserWindow);
}


module.exports = {

}