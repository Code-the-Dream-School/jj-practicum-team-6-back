const cloudinary = require('../../config/cloudinary');

const getUploadSignature = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'items'; 

    const paramsToSign = { timestamp, folder };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    return res.status(200).json({
      success: true,
      data: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        timestamp,
        folder,
        signature,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUploadSignature };
