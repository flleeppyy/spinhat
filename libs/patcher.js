//@ts-check
const path = require("path");
const fs = require("fs");
const child_process = require("child_process");

async function killrp() {
  // Kill "Reason+ Companion.exe"
  console.log("Killing any instances Reason+ Companion.exe if exists...");
  try {
    child_process.execSync('taskkill /F /T /IM "Reason+ Companion.exe"');
  } catch (e) {
    // actually this doesnt matter to me
    // console.error("Failed to kill Reason+ Companion.exe", e);
  }
}
/**
 * @param {string} src
 */
function transformPath(src) {
  const appDirList = fs.readdirSync(src);
  // really this array doesn't matter, but i just want to make sure we're ACTUALLY IN THE APP DIR
  const itemsThatShouldBeInAppDir = ["resources", "Reason+ Companion.exe", "LICENSES.chromium.html", "LICENSE.electron.txt"];

  if (appDirList.every((item) => itemsThatShouldBeInAppDir.includes(item))) {
    console.info("We're inside the electron app dir! Navigating into resources...");
    // set resource dir to the app dir
    src = path.join(src, "resources");
  }

  return src;
}
/**
 * Patches a mod into the target electron app.
 * @param {string} resourceDir Path to the resource or electron app directory
 * @param {string} patchDir Path to the patch directory
 *
 * @returns {Promise<boolean>}
 */
async function patch(resourceDir, patchDir) {
  console.debug("Patching mod into electron app...", resourceDir, patchDir);

  resourceDir = transformPath(resourceDir);

  // Check if we have read/write permissions to resourceDir
  console.debug("Checking permissions...");
  try {
    fs.accessSync(resourceDir, fs.constants.R_OK | fs.constants.W_OK);
  } catch (err) {
    throw new Error(`Cannot access ${resourceDir}`);
  }

  // Remove old patch
  console.debug("Removing old patch if exists...");
  try {
    await fs.promises.rm(path.join(resourceDir, "app"), { recursive: true });
  } catch (e) {
    if (e.code !== "ENOENT") {
      throw e;
    }
  }

  // Kill instances of Reason Companion
  await killrp();

  // Create app directory
  console.debug("Creating app directory...");
  await fs.promises.mkdir(path.join(resourceDir, "app"));

  const injector = path.join(patchDir, "libs", "injector.js");

  // Write index
  console.debug("Writing index.js...");
  await fs.promises.writeFile(path.join(resourceDir, "app", "index.js"), `require("${injector.replace(/\\/g, "\\\\")}");`);

  // Write package
  console.debug("Writing package.json...");
  await fs.promises.writeFile(
    path.join(resourceDir, "app", "package.json"),
    JSON.stringify(
      {
        name: "patcher",
        main: "index.js",
      },
      null,
      2,
    ),
  );

  console.debug("Patching complete!");

  return true;
}

/**
 *
 * @param {string} resourceDir Path to the resource directory
 * @returns {Promise<boolean>} true - successfully unpatched; false - not patched
 */
async function unpatch(resourceDir) {
  console.log(resourceDir);
  resourceDir = transformPath(resourceDir);

  if (!fs.existsSync(path.join(resourceDir, "app"))) {
    return false;
  }

  try {
    // this should not fail, but just in case
    await fs.promises.rm(path.join(resourceDir, "app"), { recursive: true });
  } catch (e) {
    if (e.code !== "ENOENT") {
      throw e;
    }
  }

  return true;
}

module.exports = {
  patch,
  unpatch,
};
