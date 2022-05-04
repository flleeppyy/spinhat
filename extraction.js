const Asar = require("asar");
const prettier = require("prettier");
const path = require("path");
const fs = require("fs");
const child_process = require("child_process");
if (!fs.existsSync(path.join(__dirname, "appasars"))) {
  fs.mkdirSync(path.join(__dirname, "appasars"));
}

const rcpath = path.join(process.env.USERPROFILE, "AppData", "Local", "Programs", "reason-plus-companion-app", "resources", "app.asar");
const version = JSON.parse(Asar.extractFile(rcpath, "package.json")).version;
if (!fs.existsSync(path.join(__dirname, "appasars", version))) {
  fs.mkdirSync(path.join(__dirname, "appasars", version));
}

const originalOutPath = path.join(process.cwd(), "appasars", version, "original");
const prettyOutPath = path.join(process.cwd(), "appasars", version, "pretty");

try {
  fs.mkdirSync(originalOutPath);
  fs.mkdirSync(prettyOutPath);
} catch (e) {}

Asar.extractAll(rcpath, originalOutPath);
Asar.extractAll(rcpath, prettyOutPath);

child_process.execSync(`.\\node_modules\\.bin\\prettier "appasars/${version}/pretty/**/*.{js,yml,json,html}" --write `, {
  cwd: process.cwd(),
  stdio: "inherit"
});

// Delete files from "pretty/build" that do not end in yml,js,json,or html
fs.readdirSync(path.join(process.cwd(), "appasars", version, "pretty", "build")).forEach(file => {
  if (!file.endsWith(".yml") && !file.endsWith(".js") && !file.endsWith(".json") && !file.endsWith(".html")) {
    fs.unlinkSync(path.join(process.cwd(), "appasars", version, "pretty", "build", file));
  }
});

