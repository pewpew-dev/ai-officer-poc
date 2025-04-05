const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
const config = require('../config/index');
const { createResponse } = require('../utils/response');
const { logError } = require('../utils/logger');
const { authenticateUser } = require('../middlewares/auth');
const { checkUsage, updateUsage } = require('../middlewares/usage');
const { validateApiRequest } = require('../middlewares/validators');

const router = express.Router();
const bucket = admin.storage().bucket();

// 스토리지 업로드 엔드포인트
router.post('/upload', authenticateUser, validateApiRequest({
  requiredFields: ['content', 'fileName']
}), checkUsage, async (req, res) => {
  try {
    const { content, fileName, contentType } = req.body;
    
    // 파일 내용 크기 검증 (config에서 최대 크기 가져오기)
    const contentSizeInMB = Buffer.byteLength(content, 'utf8') / (1024 * 1024);
    if (contentSizeInMB > config.requestLimits.maxContentSizeMB) {
      return createResponse(
        res, 
        400, 
        false, 
        null, 
        config.errorCodes.CONTENT_TOO_LARGE, 
        config.errorMessages.CONTENT_TOO_LARGE
      );
    }
    
    const user = req.user;
    const userId = user.uid;
    const timestamp = new Date().toISOString();
    const filePath = `output/${userId}/${fileName}`;
    
    const file = bucket.file(filePath);
    
    if (!contentType) {
      return createResponse(
        res, 
        400, 
        false, 
        null, 
        config.errorCodes.INVALID_REQUEST, 
        'contentType 필드가 필요합니다.'
      );
    }
    
    await file.save(content, {
      metadata: {
        contentType
      }
    });
    
    // 파일에 공개 접근 URL 생성
    const bucketUrl = config.settings.get().gcsBucketUrl;
    const bucketName = config.settings.get().gcsBucketName;
    const url = `${bucketUrl}/${bucketName}/${filePath}`;
    
    // 사용량 업데이트
    await updateUsage(req.usageRef, req.usage, req.estimatedCredits);
    
    return createResponse(res, 200, true, {
      url,
      fileName
    }, null, null);
  } catch (error) {
    logError(config.logMessages.STORAGE_UPLOAD_ERROR, error);
    
    return createResponse(
      res, 
      500, 
      false, 
      null, 
      config.errorCodes.STORAGE_UPLOAD_ERROR, 
      error.message ? error.message : config.errorMessages.STORAGE_UPLOAD_ERROR
    );
  }
});

// 이미지 URL 업로드 엔드포인트
router.post('/upload-from-url', authenticateUser, validateApiRequest({
  requiredFields: ['imageUrl', 'fileName']
}), checkUsage, async (req, res) => {
  try {
    const { imageUrl, fileName, contentType } = req.body;
    
    if (!imageUrl || !imageUrl.startsWith('http')) {
      return createResponse(
        res, 
        400, 
        false, 
        null, 
        config.errorCodes.INVALID_URL, 
        config.errorMessages.INVALID_URL
      );
    }
    
    // URL에서 이미지 다운로드
    let response;
    try {
      response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000 // 10초 타임아웃
      });
    } catch (downloadError) {
      return createResponse(
        res, 
        400, 
        false, 
        null, 
        config.errorCodes.IMAGE_DOWNLOAD_FAILED, 
        config.errorMessages.IMAGE_DOWNLOAD_FAILED + ': ' + downloadError.message
      );
    }
    
    // 이미지 데이터 가져오기
    const imageBuffer = Buffer.from(response.data);
    
    // 파일 내용 크기 검증
    const contentSizeInMB = imageBuffer.length / (1024 * 1024);
    if (contentSizeInMB > config.requestLimits.maxContentSizeMB) {
      return createResponse(
        res, 
        400, 
        false, 
        null, 
        config.errorCodes.CONTENT_TOO_LARGE, 
        config.errorMessages.CONTENT_TOO_LARGE
      );
    }
    
    const user = req.user;
    const userId = user.uid;
    const filePath = `output/${userId}/${fileName}`;
    
    const file = bucket.file(filePath);
    
    if (!contentType) {
      return createResponse(
        res, 
        400, 
        false, 
        null, 
        config.errorCodes.INVALID_REQUEST, 
        'contentType 필드가 필요합니다.'
      );
    }
    
    await file.save(imageBuffer, {
      metadata: {
        contentType
      }
    });
    
    // 스토리지 경로로 URL 생성 (allUsers에게 읽기 권한이 있으므로 공개 URL 생성 필요 없음)
    const bucketUrl = config.settings.get().gcsBucketUrl;
    const bucketName = config.settings.get().gcsBucketName;
    const url = `${bucketUrl}/${bucketName}/${filePath}`;
    
    // 사용량 업데이트 - 이미지 크기에 따른 크레딧 계산
    const fileSizeKB = imageBuffer.length / 1024;
    const estimatedCredits = Math.max(
      config.apiUsageCalc.storage.minCredits,
      Math.ceil(fileSizeKB * config.apiUsageCalc.storage.kbFactor)
    );
    
    // 기존 추정 크레딧을 새로운 값으로 업데이트
    req.estimatedCredits = estimatedCredits;
    
    // 사용량 업데이트
    await updateUsage(req.usageRef, req.usage, req.estimatedCredits);
    
    return createResponse(res, 200, true, {
      url,
      fileName
    }, null, null);
  } catch (error) {
    logError(config.logMessages.STORAGE_UPLOAD_ERROR, error);
    
    return createResponse(
      res, 
      500, 
      false, 
      null, 
      config.errorCodes.STORAGE_UPLOAD_ERROR, 
      error.message ? error.message : config.errorMessages.STORAGE_UPLOAD_ERROR
    );
  }
});

module.exports = router;
