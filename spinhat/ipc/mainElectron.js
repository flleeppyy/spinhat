/**
 * @name mainElectron
 * @description Custom ipcMain's for Electron's main process
 */

const { ipcMain } = require("electron");

// nothing here yet

ipcMain.on("SPINHAT_HEEHOO", (event, arg) => {
  console.log(arg);
});