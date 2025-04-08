const express = require('express');
const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Anthropic } = require('@anthropic-ai/sdk');
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

// Firebase Functions 환경 변수
const functionConfig = functions.config();

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: functionConfig?.openai?.api_key
});

// Google Gemini 클라이언트 초기화
const genAI = new GoogleGenerativeAI(
  functionConfig?.google?.api_key
);

// Anthropic Claude 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: functionConfig?.anthropic?.api_key
});

// API 기본 설정값 상수 정의
const DEFAULT_MAX_TOKENS = 100000;

// OpenAI API 호출 엔드포인트
router.post('/openai', authenticateUser, checkUsage, apiTimeout, validateApiRequest({
  requiredFields: ['type'],
  specificValidation: validateOpenAIRequestType
}), async (req, res) => {
  try {
    const { type, model, messages, prompt, n, size, max_tokens } = req.body;
    
    if (!model) {
      return createResponse(
        res, 
        400, 
        false, 
        null, 
        config.errorCodes.INVALID_REQUEST, 
        'model 필드가 필요합니다.'
      );
    }
    
    let result;
    
    switch (type) {
      case 'text':
        if (!messages) {
          return createResponse(
            res, 
            400, 
            false, 
            null, 
            config.errorCodes.INVALID_REQUEST, 
            'messages 필드가 필요합니다.'
          );
        }
        
        result = await openai.chat.completions.create({
          model,
          messages,
          max_tokens: max_tokens || DEFAULT_MAX_TOKENS
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
        
        // DALL-E 3 API에 필요한 추가 파라미터 추출
        const { quality, style } = req.body;
        
        // 이미지 생성 요청 구성
        const imageRequestParams = {
          model, // model 파라미터 유지
          prompt,
          n,
          size,
        };
        
        // 선택적 파라미터 추가 (제공된 경우에만)
        if (quality) imageRequestParams.quality = quality;
        if (style) imageRequestParams.style = style;
        
        result = await openai.images.generate(imageRequestParams);
        
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

// Google Gemini API 호출 엔드포인트
router.post('/google', authenticateUser, checkUsage, apiTimeout, validateApiRequest({
  requiredFields: ['type', 'contents'],
}), async (req, res) => {
  try {
    const { type, model, contents, max_tokens } = req.body;
    
    if (!model) {
      return createResponse(
        res, 
        400, 
        false, 
        null, 
        config.errorCodes.INVALID_REQUEST, 
        'model 필드가 필요합니다.'
      );
    }
    
    let result;
    
    switch (type) {
      case 'text':
        // Gemini 모델 생성
        const geminiModel = genAI.getGenerativeModel({ 
          model
        });
        
        // 생성 구성 설정
        const generationConfig = {
          maxOutputTokens: max_tokens || DEFAULT_MAX_TOKENS
        };
        
        // 채팅 세션 생성
        const chat = geminiModel.startChat({
          generationConfig
        });
        
        // 멀티모달 또는 텍스트 전용 처리
        const response = await chat.sendMessage(contents[0]);
        
        // 텍스트 응답 구조 간소화
        result = {
          content: response.response.text()
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
    logError('Google Gemini API Error', error);
    return createResponse(
      res, 
      500, 
      false, 
      null, 
      'GOOGLE_ERROR', 
      error.message ? error.message : 'Google Gemini API 호출 중 오류가 발생했습니다.'
    );
  }
});

// Anthropic Claude API 호출 엔드포인트
router.post('/anthropic', authenticateUser, checkUsage, apiTimeout, validateApiRequest({
  requiredFields: ['type', 'messages'],
}), async (req, res) => {
  try {
    const { type, model, messages, max_tokens, temperature } = req.body;
    
    if (!model) {
      return createResponse(
        res, 
        400, 
        false, 
        null, 
        config.errorCodes.INVALID_REQUEST, 
        'model 필드가 필요합니다.'
      );
    }
    
    if (!temperature) {
      return createResponse(
        res, 
        400, 
        false, 
        null, 
        config.errorCodes.INVALID_REQUEST, 
        'temperature 필드가 필요합니다.'
      );
    }
    
    let result;
    
    switch (type) {
      case 'text':
        const response = await anthropic.messages.create({
          model,
          messages,
          max_tokens: max_tokens || DEFAULT_MAX_TOKENS,
          temperature
        });
        
        // 텍스트 응답 구조 간소화
        result = {
          content: response.content[0].text
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
    logError('Anthropic Claude API Error', error);
    return createResponse(
      res, 
      500, 
      false, 
      null, 
      'CLAUDE_ERROR', 
      error.message ? error.message : 'Anthropic Claude API 호출 중 오류가 발생했습니다.'
    );
  }
});

// 통합 모델 API 엔드포인트 (모델 타입에 따라 각 엔드포인트로 라우팅)
router.post('/', authenticateUser, checkUsage, apiTimeout, validateApiRequest({
  requiredFields: ['provider'],
}), (req, res) => {
  const { provider } = req.body;
  
  // 요청을 적절한 모델 제공자 엔드포인트로 라우팅
  switch (provider) {
    case 'openai':
      return router.handle(Object.assign(req, { url: '/openai', method: 'POST' }), res);
      
    case 'google':
      return router.handle(Object.assign(req, { url: '/google', method: 'POST' }), res);
      
    case 'anthropic':
      return router.handle(Object.assign(req, { url: '/anthropic', method: 'POST' }), res);
      
    default:
      return createResponse(
        res, 
        400, 
        false, 
        null, 
        config.errorCodes.INVALID_REQUEST, 
        '지원하지 않는 AI 모델 제공자입니다. openai, google, anthropic 중 하나를 사용하세요.'
      );
  }
});

// 라우터 정보 로깅
logInfo(config.logMessages.ROUTER_INITIALIZED, { router: 'model' });

module.exports = router;
