import UserIdentity from '../modules/auth/userIdentity.model.js';

const protectRoute = async (req, res, next) => {
  try {
    // Look cleanly across custom specialized headers, parameters, and bodies
    const rawEmail = 
      req.headers?.['x-doctor-email'] ||
      req.headers?.['x-patient-email'] ||
      req.headers?.['x-user-email'] || 
      req.query?.email || 
      req.query?.doctorEmail ||
      req.query?.patientEmail ||
      req.body?.doctorEmail ||
      req.body?.patientEmail ||
      req.body?.email;

    if (!rawEmail || typeof rawEmail !== 'string') {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication context missing: Please provide a valid email via authorization tracking headers or query string parameters.'
      });
    }

    const clientEmail = rawEmail.toLowerCase().trim();
    const currentUser = await UserIdentity.findOne({ email: clientEmail }).lean();
    
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: `No active profile identity map match tracking under user email: ${rawEmail}`
      });
    }

    // Explicitly bind the unified database parameters to the ongoing request object context
    req.user = {
      id: currentUser._id,
      email: currentUser.email,
      role: currentUser.role?.toLowerCase().trim(),
      firstName: currentUser.firstName,
      lastName: currentUser.lastName
    };

    return next();
  } catch (error) {
    console.error("[Auth Middleware Exception Failure]:", error.message);
    return res.status(500).json({
      status: 'error',
      message: `Internal authorization runtime bottleneck anomaly: ${error.message}`
    });
  }
};

/**
 * Reusable dynamic role validation checking factory matrix middleware.
 * @param {String} requiredRole - The lowercased role name string token validation baseline ('doctor', 'patient').
 */
export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole.toLowerCase().trim()) {
      return res.status(403).json({
        status: 'fail',
        message: `Access denied: Hierarchical operations require a verified '${requiredRole}' assignment permissions context.`
      });
    }
    return next();
  };
};

// Legacy static shorthand references to maintain compatibility with your existing routes code
export const requireDoctor = requireRole('doctor');
export const requirePatient = requireRole('patient');

export default protectRoute;