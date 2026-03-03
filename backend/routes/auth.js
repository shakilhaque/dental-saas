const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  registerClinic, registerStaff, registerPatient,
  login, getMe, updateProfile, changePassword,
  forgotPassword, resetPassword
} = require('../controllers/authController');

router.post('/register-clinic', registerClinic);
router.post('/register-patient/:subdomain', registerPatient);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

router.use(protect);
router.post('/register-staff', authorize('clinic_admin'), registerStaff);
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

module.exports = router;
