const express = require('express');
const admin = require('firebase-admin');
const config = require('../config/index');
const { createResponse } = require('../utils/response');
const { authenticateUser } = require('../middlewares/auth');

const router = express.Router();

// 사용자 사용량 조회 엔드포인트
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const settings = config.settings.get();
    const db = admin.firestore();
    const usageRef = db.collection(settings.firebaseUsageCollection).doc(userId);
    const usageDoc = await usageRef.get();
    
    let usage = {
      used: 0,
      limit: settings.userCreditLimit,
      remaining: settings.userCreditLimit
    };
    
    if (usageDoc.exists) {
      usage = { ...usage, ...usageDoc.data() };
    }
    
    return createResponse(res, 200, true, usage, null, null);
  } catch (error) {
    console.error(config.logMessages.USAGE_ERROR, error);
    return createResponse(
      res, 
      500, 
      false, 
      null, 
      config.errorCodes.SERVER_ERROR, 
      config.errorMessages.SERVER_ERROR
    );
  }
});

module.exports = router;
