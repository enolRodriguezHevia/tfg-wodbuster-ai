const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-south-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET = process.env.AWS_S3_PROFILE_BUCKET || 'wodbuster-profile-photos';

async function uploadProfilePhotoToS3(fileBuffer, fileName, mimetype) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimetype
  });
  await s3.send(command);
  // Usar endpoint regional
  const region = process.env.AWS_REGION || 'eu-south-2';
  return `https://${BUCKET}.s3.${region}.amazonaws.com/${fileName}`;
}

module.exports = { uploadProfilePhotoToS3 };
