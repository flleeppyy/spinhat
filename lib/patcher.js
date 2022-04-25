const path = require("path");
const fs = require("fs");

async function patch(resourceDir, patchDir) {

  // Check if we have read/write permissions to resourceDir
  try {
    fs.accessSync(resourceDir, fs.constants.R_OK | fs.constants.W_OK);
  } catch (err) {
    console.error(`Cannot access ${resourceDir}`);
    throw new Error(`Cannot access ${resourceDir}`);
  }

  // Remove old patch
  try {
    await fs.promises.rmdir(path.join(resourceDir, "app"), { recursive: true });
  } catch (e) {
    if (e.code !== "ENOENT") {
      throw e;
    }
  }

  /// Copy new patch

  // Create app directory
  await fs.promises.mkdir(path.join(resourceDir, "app"));

  const injector = path.join(patchDir, "lib", "injector.js");

  // Write index
  await fs.promises.writeFile(
    path.join(resourceDir, "app", "index.js"),
    `require("${injector}").inject(require("path").join(__dirname,));`
  );

  // Write package
  await fs.promises.writeFile(
    path.join(resourceDir, "package.json"),
    JSON.stringify({
      name: "patcher",
      main: "index.js",
    }, null, 2)
  );

  // And we're done
}
