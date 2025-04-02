/**
 * 스토리지 관련 설정
 */

// GCS 설정 (게터 프로퍼티로 설정값 조회)
const gcsSettings = (settings) => ({
  get bucketName() {
    return settings.get().gcsBucketName;
  },
  get bucketUrl() {
    return settings.get().gcsBucketUrl;
  },
  fileNameTemplates: {
    generatedWebsite: 'generated_website_{timestamp}.html',
    userUpload: 'users/{userId}/{filename}'
  },
  contentTypes: {
    html: 'text/html',
    json: 'application/json',
    css: 'text/css',
    js: 'application/javascript'
  }
});

module.exports = {
  gcsSettings
};
