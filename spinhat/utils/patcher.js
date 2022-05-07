//@ts-check
const path = require("path");
const fs = require("fs");
const child_process = require("child_process");

async function killrp() {
  // Kill "Reason+ Companion.exe"
  console.log("Killing any instances Reason+ Companion.exe they're running...");
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
  checkInstalled();

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

  // CHeck if the app dir still exists
  if (fs.existsSync(path.join(resourceDir, "app"))) {
    throw new Error(`${path.join(resourceDir, "app")} still exists even after we deleted it. Please delete it manually, then repatch.`);
  }
  // Kill instances of Reason Companion
  await killrp();

  // Create app directory
  console.debug("Creating app directory...");
  await fs.promises.mkdir(path.join(resourceDir, "app"));

  const injector = path.join(patchDir, "spinhat", "main.js");

  // Write index
  console.debug("Writing index.js...");
  await fs.promises.writeFile(path.join(resourceDir, "app", "index.js"), `require("${injector.replace(/\\/g, "\\\\")}");`);

  // Write package
  console.debug("Writing package.json...");
  await fs.promises.writeFile(
    path.join(resourceDir, "app", "package.json"),
    JSON.stringify(
      {
        name: "Reason+ Companion",
        main: "index.js",
      },
      null,
      2,
    ),
  );

  // Run pnpm install in the previous directory
  console.debug("Running pnpm install...");
  await pnpmInstall(path.join(__dirname, "../"));
  
  console.debug("Patching complete!");
  

  return true;
}

async function pnpmInstall(dir) {
  console.log("Installing dependencies...");
  const exec = child_process.spawn("pnpm", ["install"], { cwd: dir });

  exec.stdout.pipe(process.stdout);
  exec.stderr.pipe(process.stderr);
  
  // Wait for pnpm install to finish
  try {
    await new Promise((resolve, reject) => {
      exec.on("exit", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error("pnpm install failed. " + exec.stderr.read().toString()));
        }
      });

      exec.on("error", (err) => {
        reject(err);
      });
    });
  } catch (e) {
    throw e;
  }
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

async function installPnpm() {
  console.log("Installing pnpm...");
  try {
    await child_process.execSync("npm i -g pnpm");
  } catch (e) {
    throw new Error("Failed to install pnpm");
  }
}

/**
 * Checks if node, npm and pnpm are installed
 */
function checkInstalled() {
  console.log("Checking if node, npm and pnpm are installed...");
  try {
    child_process.execSync("node -v");
  } catch (e) {
    throw new Error("Node is not installed");
  }

  try {
    child_process.execSync("npm -v");
  } catch (e) {
    throw new Error("Npm is not installed");
  }

  try {
    child_process.execSync("pnpm -v");
  } catch (e) {
    installPnpm();
  }

  console.log("All dependencies are installed!");


}
module.exports = {
  patch,
  unpatch,
};
