const net = require("net");
const path = require("path");
const { spawn } = require("child_process");

const ML_PORT = Number(process.env.ML_SERVICE_PORT || 5000);
const ML_HOST = "127.0.0.1";
const APP_DIR = path.resolve(__dirname, "..", "ml_services", "Disease_Prediction");
const APP_FILE = path.join(APP_DIR, "app.py");

let startedByThisProcess = false;

function isPortOpen(port, host) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("error", () => resolve(false));
    socket.setTimeout(500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function spawnPython(command, args) {
  return spawn(command, args, {
    cwd: APP_DIR,
    env: process.env,
    stdio: "inherit",
  });
}

function startWithFallback(command, args, fallback) {
  const child = spawnPython(command, args);

  child.once("error", (error) => {
    if (error.code === "ENOENT" && fallback) {
      fallback();
      return;
    }

    console.error(`[ml-service] Failed to start Flask service: ${error.message}`);
  });

  child.once("spawn", () => {
    startedByThisProcess = true;
    console.log(`[ml-service] Flask server starting on http://localhost:${ML_PORT}`);
  });
}

async function startMlService() {
  if (process.env.AAROGYA_SKIP_ML_SERVICE === "1" || startedByThisProcess) {
    return;
  }

  const alreadyRunning = await isPortOpen(ML_PORT, ML_HOST);
  if (alreadyRunning) {
    console.log(`[ml-service] Existing server detected on port ${ML_PORT}`);
    return;
  }

  startWithFallback("python", [APP_FILE], () => {
    startWithFallback("py", ["-3", APP_FILE], () => {
      startWithFallback("python3", [APP_FILE]);
    });
  });
}

module.exports = { startMlService };
