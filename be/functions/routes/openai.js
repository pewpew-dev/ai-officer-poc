const express = require('express');
const { OpenAI } = require('openai');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const config = require('../config/index');
const { createResponse } = require('../utils/response');
const { logError, logInfo } = require('../utils/logger');
const { authenticateUser } = require('../middlewares/auth');
const { checkUsage, updateUsage } = require('../middlewares/usage');
const { validateApiRequest, validateOpenAIRequestType } = require('../middlewares/validators');
const { apiTimeout } = require('../middlewares/timeout');

const router = express.Router();

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: functions.config().openai.api_key
});

// OpenAI API 호출 엔드포인트
router.post('/', authenticateUser, checkUsage, apiTimeout, validateApiRequest({
  requiredFields: ['type'],
  specificValidation: validateOpenAIRequestType
}), async (req, res) => {
  try {
    const { type, model, messages, prompt, n, size } = req.body;
    
    let result;
    
    switch (type) {
      case 'text':
        result = await openai.chat.completions.create({
          model,
          messages,
        });
        
        // 텍스트 응답 구조 간소화
        result = {
          content: result.choices[0].message.content
        };
        break;
        
      case 'image':
        if (!prompt) {
          return createResponse(
            res, 
            400, 
            false, 
            null, 
            config.errorCodes.INVALID_REQUEST, 
            'prompt 필드가 필요합니다.'
          );
        }
        
        if (!n || !size) {
          return createResponse(
            res, 
            400, 
            false, 
            null, 
            config.errorCodes.INVALID_REQUEST, 
            'n과 size 필드가 필요합니다.'
          );
        }
        
        result = await openai.images.generate({
          prompt,
          n,
          size,
        });
        
        // 이미지 응답 구조 간소화
        result = {
          images: result.data.map(item => ({ url: item.url }))
        };
        break;
        
      default:
        return createResponse(
          res, 
          400, 
          false, 
          null, 
          config.errorCodes.INVALID_REQUEST, 
          config.errorMessages.UNSUPPORTED_TYPE
        );
    }
    
    // 사용량 업데이트
    await updateUsage(req.usageRef, req.usage, req.estimatedCredits);
    
    // API 응답 형식을 문서와 일치시킴
    return createResponse(res, 200, true, result, null, null);
  } catch (error) {
    logError(config.logMessages.OPENAI_API_ERROR, error);
    return createResponse(
      res, 
      500, 
      false, 
      null, 
      config.errorCodes.OPENAI_ERROR, 
      error.message ? error.message : config.errorMessages.OPENAI_ERROR
    );
  }
});

module.exports = router;
