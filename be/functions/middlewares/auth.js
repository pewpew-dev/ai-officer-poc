const admin = require('firebase-admin');
const config = require('../config/index');
const { createResponse } = require('../utils/response');

// 사용자 인증 미들웨어
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createResponse(
        res, 
        401, 
        false, 
        null, 
        config.errorCodes.UNAUTHORIZED, 
        config.errorMessages.UNAUTHORIZED
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error(config.logMessages.AUTH_ERROR, error);
    return createResponse(
      res, 
      401, 
      false, 
      null, 
      config.errorCodes.INVALID_TOKEN, 
      config.errorMessages.INVALID_TOKEN
    );
  }
};

module.exports = {
  authenticateUser
};
