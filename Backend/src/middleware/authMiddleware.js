import jwt from 'jsonwebtoken';
import UserIdentity from '../modules/auth/userIdentity.model.js';

const protectRoute = async (req, res, next) => {
  try {

    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return res.status(500).json({ status: 'error', message: 'JWT_SECRET not configured.' });
      }
      try {
        const decoded = jwt.verify(token, jwtSecret);
        const user = await UserIdentity.findById(decoded.id).lean();
        if (!user) {
          return res.status(401).json({ status: 'fail', message: 'Token user no longer exists.' });
        }
        req.user = {
          id: user._id,
          email: user.email,
          role: user.role?.toLowerCase().trim(),
          firstName: user.firstName,
          lastName: user.lastName
        };
        return next();
      } catch (jwtError) {
        return res.status(401).json({ status: 'fail', message: 'Invalid or expired session token. Please log in again.' });
      }
    }
    const rawEmail =
      req.headers?.['x-user-email'] ||
      req.headers?.['x-doctor-email'] ||
      req.headers?.['x-patient-email'] ||
      req.headers?.['x-nurse-email'] ||
      req.headers?.['x-receptionist-email'] ||
      req.headers?.['x-pharmacist-email'] ||
      req.headers?.['x-labtechnician-email'] ||

      req.query?.email ||
      req.query?.doctorEmail ||
      req.query?.patientEmail ||
      req.query?.nurseEmail ||
      req.query?.receptionistEmail ||
      req.query?.pharmacistEmail ||
      req.query?.labTechnicianEmail ||

      req.body?.email ||
      req.body?.doctorEmail ||
      req.body?.patientEmail ||
      req.body?.nurseEmail ||
      req.body?.receptionistEmail ||
      req.body?.pharmacistEmail ||
      req.body?.labTechnicianEmail;

    if (!rawEmail || typeof rawEmail !== 'string') {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required: provide a Bearer token or email parameter.'
      });
    }

    const clientEmail = rawEmail.toLowerCase().trim();
    const currentUser = await UserIdentity.findOne({ email: clientEmail }).lean();
    if (!currentUser) {
      return res.status(401).json({ status: 'fail', message: `No active profile found for: ${rawEmail}` });
    }

    req.user = {
      id: currentUser._id,
      email: currentUser.email,
      role: currentUser.role?.toLowerCase().trim(),
      firstName: currentUser.firstName,
      lastName: currentUser.lastName
    };

    return next();
  } catch (error) {
    console.error("[Auth Middleware Exception]:", error.message);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole.toLowerCase().trim()) {
      return res.status(403).json({
        status: 'fail',
        message: `Access denied: requires '${requiredRole}' role.`
      });
    }
    return next();
  };
};

export const requireDoctor = requireRole('doctor');
export const requirePatient = requireRole('patient');

export default protectRoute;