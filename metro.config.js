const { getDefaultConfig } = require("expo/metro-config");
const { startMlService } = require("./scripts/start-ml-service");

startMlService().catch((error) => {
  console.error(`[ml-service] Startup check failed: ${error.message}`);
});

const config = getDefaultConfig(__dirname);

module.exports = config;
