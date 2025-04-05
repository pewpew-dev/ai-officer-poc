const config = require('../config/index');
const { createResponse } = require('../utils/response');

// API 요청 타임아웃 미들웨어 
const apiTimeout = (req, res, next) => {
  const type = req.body.type;
  let timeout = config.requestLimits.timeouts.default; // config에서 기본 타임아웃 가져오기
  
  if (type === 'image') {
    timeout = config.requestLimits.timeouts.image; // config에서 이미지 타임아웃 가져오기
  } else if (type === 'code') {
    timeout = config.requestLimits.timeouts.code; // config에서 코드 타임아웃 가져오기
  }
  
  // 타임아웃 설정
  req.setTimeout(timeout, () => {
    if (!res.headersSent) {
      return createResponse(
        res, 
        408, 
        false, 
        null, 
        config.errorCodes.REQUEST_TIMEOUT, 
        config.errorMessages.REQUEST_TIMEOUT
      );
    }
  });
  
  next();
};

module.exports = {
  apiTimeout
};
