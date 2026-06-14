const net = require("net");
const path = require("path");
const { spawn } = require("child_process");

const CHATBOT_PORT = Number(process.env.CHATBOT_SERVICE_PORT || 5001);
const CHATBOT_HOST = "127.0.0.1";
const APP_DIR = path.resolve(__dirname, "..", "chatbot_service");
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

    console.error(`[chatbot-service] Failed to start chatbot service: ${error.message}`);
  });

  child.once("spawn", () => {
    startedByThisProcess = true;
    console.log(`[chatbot-service] Flask server starting on http://localhost:${CHATBOT_PORT}`);
  });
}

async function startChatbotService() {
  if (startedByThisProcess) {
    return;
  }

  const alreadyRunning = await isPortOpen(CHATBOT_PORT, CHATBOT_HOST);
  if (alreadyRunning) {
    console.log(`[chatbot-service] Existing server detected on port ${CHATBOT_PORT}`);
    return;
  }

  startWithFallback("python", [APP_FILE], () => {
    startWithFallback("py", ["-3", APP_FILE], () => {
      startWithFallback("python3", [APP_FILE]);
    });
  });
}

module.exports = { startChatbotService };
