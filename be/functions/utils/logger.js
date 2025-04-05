const logger = require("firebase-functions/logger");

// 로깅 개선을 위해 logger 사용
const logInfo = (message, data) => {
  logger.info(message, {structuredData: data || true});
};

const logError = (message, error) => {
  logger.error(message, {structuredData: error || true});
};

module.exports = {
  logInfo,
  logError
};
