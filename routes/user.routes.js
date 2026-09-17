import { Router } from "express";
import { getProfile, login, logout, register, updateProfile } from "../controllers/user.controller.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

 const router = Router();
 
 router.post('/register', register);
 router.post('/login',login)
 router.post('/logout', logout)
 router.put('/profile', isAuthenticated, updateProfile);
 router.get('/fetch-profile', isAuthenticated, getProfile);
 
 
 
 export default router;
