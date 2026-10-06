import { Router } from "express";
import { changePassword, getProfile, login, logout, register, requestPasswordReset, resetPassword, updateProfile } from "../controllers/user.controller.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

 const router = Router();
 
 router.post('/register', register);
 router.post('/login',login)
 router.post('/forgot-password', requestPasswordReset)
 router.post('/reset-password', resetPassword)
 router.post('/logout', logout)
 router.put('/change-password', isAuthenticated, changePassword);
 router.put('/profile', isAuthenticated, updateProfile);
 router.get('/fetch-profile', isAuthenticated, getProfile);
 
 
 
 export default router;
