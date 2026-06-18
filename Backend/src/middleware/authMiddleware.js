import UserIdentity from '../modules/auth/userIdentity.model.js';

const protectRoute = async (req, res, next) => {
  try {
    const clientEmail = req.query.email || req.body.email;

    if (!clientEmail) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication context missing: Please provide an email parameter query.'
      });
    }

    const currentUser = await UserIdentity.findOne({ email: clientEmail.toLowerCase().trim() });
    
    if (!currentUser) {
      return res.status(444).json({
        status: 'fail',
        message: `No active profile identity matching email: ${clientEmail}`
      });
    }

    req.user = {
      id: currentUser._id,
      email: currentUser.email,
      role: currentUser.role
    };

    return next();
  } catch (error) {
    console.error("[Auth Bypass Middleware Error Exception]:", error.message);
    return res.status(500).json({
      status: 'error',
      message: `Internal auth middleware bottleneck: ${error.message}`
    });
  }
};

export default protectRoute;