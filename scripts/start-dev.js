const { spawn } = require("child_process");
const fs = require("fs");
const net = require("net");
const path = require("path");
const { startMlService } = require("./start-ml-service");
const { startChatbotService } = require("./start-chatbot-service");

const BACKEND_PORT = Number(process.env.BACKEND_PORT || 8016);
const BACKEND_HOST = "127.0.0.1";
const BACKEND_DIR = path.resolve(__dirname, "..", "backend");

function getExpoEnv() {
  return Object.fromEntries(
    Object.entries({
      ...process.env,
      AAROGYA_SKIP_ML_SERVICE: "1",
    }).filter(([, value]) => typeof value === "string")
  );
}

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

function findMavenCommand() {
  const home = process.env.USERPROFILE || process.env.HOME;
  if (!home) {
    return null;
  }

  const distsDir = path.join(home, ".m2", "wrapper", "dists");
  if (!fs.existsSync(distsDir)) {
    return null;
  }

  const candidates = [];
  for (const distName of fs.readdirSync(distsDir)) {
    if (!distName.startsWith("apache-maven-")) {
      continue;
    }

    const distDir = path.join(distsDir, distName);
    for (const hashName of fs.readdirSync(distDir)) {
      const mvnCommand = path.join(
        distDir,
        hashName,
        "bin",
        process.platform === "win32" ? "mvn.cmd" : "mvn"
      );

      if (fs.existsSync(mvnCommand)) {
        candidates.push(mvnCommand);
      }
    }
  }

  candidates.sort();
  return candidates.at(-1) || null;
}

async function startSpringBootBackend() {
  if (process.env.AAROGYA_SKIP_SPRING_BACKEND === "1") {
    return;
  }

  const alreadyRunning = await isPortOpen(BACKEND_PORT, BACKEND_HOST);
  if (alreadyRunning) {
    console.log(`[spring-backend] Existing server detected on port ${BACKEND_PORT}`);
    return;
  }

  const command = process.platform === "win32" ? "mvnw.cmd" : "./mvnw";
  const args = ["spring-boot:run"];

  const backend = spawn(command, args, {
    cwd: BACKEND_DIR,
    env: process.env,
    stdio: "inherit",
    shell: true,
  });

  backend.once("spawn", () => {
    console.log(`[spring-backend] Spring Boot starting on http://localhost:${BACKEND_PORT}`);
  });

  backend.once("error", (error) => {
    console.error(`[spring-backend] Failed to start Spring Boot: ${error.message}`);
  });
}

async function main() {
  await startMlService();
  await startChatbotService();
  await startSpringBootBackend();

  const expoCli = path.resolve(__dirname, "..", "node_modules", "expo", "bin", "cli");
  const expo = spawn(process.execPath, [expoCli, "start", ...process.argv.slice(2)], {
    cwd: process.cwd(),
    env: getExpoEnv(),
    stdio: "inherit",
  });

  expo.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code || 0);
  });

  expo.on("error", (error) => {
    console.error(`[dev] Failed to start Expo: ${error.message}`);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error(`[dev] Startup failed: ${error.message}`);
  process.exit(1);
});
