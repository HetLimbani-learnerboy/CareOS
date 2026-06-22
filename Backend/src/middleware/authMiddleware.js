import UserIdentity from '../modules/auth/userIdentity.model.js';

const protectRoute = async (req, res, next) => {
  try {
    // FIXED: Safely look for generic email, patientEmail, or doctorEmail fields
    const clientEmail = req.query.email || req.body.email || req.body.patientEmail || req.body.doctorEmail;

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
    const errMsg = error && error.message ? error.message : 'Unknown middleware allocation crash';
    console.error("[Auth Bypass Middleware Error Exception]:", errMsg);
    return res.status(500).json({
      status: 'error',
      message: `Internal auth middleware bottleneck: ${errMsg}`
    });
  }
};

export default protectRoute;