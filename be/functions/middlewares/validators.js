const config = require('../config/index');
const { createResponse } = require('../utils/response');

// API 요청 검증 통합 미들웨어
const validateApiRequest = (validationConfig) => {
  return (req, res, next) => {
    const { type, requiredFields, specificValidation } = validationConfig;
    
    // 타입 검증
    if (type && req.body.type !== type) {
      return createResponse(
        res,
        400,
        false,
        null,
        config.errorCodes.INVALID_REQUEST,
        config.errorMessages.INVALID_TYPE(type)
      );
    }
    
    // 필수 필드 검증
    if (requiredFields && Array.isArray(requiredFields)) {
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return createResponse(
            res,
            400,
            false,
            null,
            config.errorCodes.INVALID_REQUEST,
            config.errorMessages.MISSING_FIELD(field)
          );
        }
      }
    }
    
    // 타입별 특수 검증 로직
    if (specificValidation && typeof specificValidation === 'function') {
      const validationResult = specificValidation(req, res);
      if (validationResult) return validationResult;
    }
    
    next();
  };
};

// OpenAI 타입별 검증 함수
const validateOpenAIRequestType = (req, res) => {
  if (!req.body.type) {
    return createResponse(
      res, 
      400, 
      false, 
      null, 
      config.errorCodes.INVALID_REQUEST, 
      config.errorMessages.MISSING_TYPE
    );
  }
  
  switch (req.body.type) {
    case 'text':
      if (!req.body.model || !req.body.messages) {
        return createResponse(
          res, 
          400, 
          false, 
          null, 
          config.errorCodes.INVALID_REQUEST, 
          config.errorMessages.MISSING_MODEL_MESSAGES
        );
      }
      break;
      
    case 'image':
      if (!req.body.prompt) {
        return createResponse(
          res, 
          400, 
          false, 
          null, 
          config.errorCodes.INVALID_REQUEST, 
          config.errorMessages.MISSING_PROMPT
        );
      }
      break;
      
    default:
      return createResponse(
        res, 
        400, 
        false, 
        null, 
        config.errorCodes.UNSUPPORTED_TYPE, 
        config.errorMessages.UNSUPPORTED_TYPE
      );
  }
  
  return null; // 검증 통과
};

module.exports = {
  validateApiRequest,
  validateOpenAIRequestType
};
