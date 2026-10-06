import User from "../models/user.model.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { isPasswordResetEmailConfigured, sendPasswordResetEmail } from "../utils/email.js";

const supportedLanguages = ["de", "fr", "en", "es", "it", "pt", "ja", "ko", "zh", "ar"];
const normalizeEmail = (email) => email.trim().toLowerCase();
const isValidEmail = (email) => /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i.test(email);
const isValidName = (name) => /^\p{L}[\p{L}\p{M}]*(?:[ '\u2019-]\p{L}[\p{L}\p{M}]*)*$/u.test(name);

const normalizeLanguages = (value, fallback = ["de"]) => {
    const values = value === undefined
        ? fallback
        : Array.isArray(value)
            ? value
            : [value];

    if (!values.length || values.some((language) => !supportedLanguages.includes(language))) {
        return null;
    }

    return [...new Set(values)];
};

export const register = async (req,res) => {
    const { name, nationality, email, password, language } = req.body;
    const languages = normalizeLanguages(language);
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? normalizeEmail(email) : "";

    //check any field is empty
    //check the user with email exists or not
    // if not exist hashed the password
    // create the user
    //return a successfull response

    if (!normalizedName || !nationality || !normalizedEmail || !password)
    {
       return res.status(400).json({
            'success': false,
            'message':"all fields are required"
        })
}

    if (normalizedName.length > 20 || !isValidName(normalizedName)) {
        return res.status(400).json({ success: false, message: "invalid name" });
    }

    if (!isValidEmail(normalizedEmail)) {
        return res.status(400).json({ success: false, message: "invalid email address" });
    }

    if (!languages) {
        return res.status(400).json({
            success: false,
            message: "language contains an unsupported code"
        });
    }

  
    try {
        const existingUser = await User.findOne({ email: normalizedEmail }).collation({ locale: "en", strength: 2 });
        if (existingUser) {
            return res.status(409).json({
                "success": false,
                "message":"user already exists"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: normalizedName,
            nationality,
            email: normalizedEmail,
            password: hashedPassword,
            language: languages,
        })

        const token = jwt.sign(
            { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        return res.status(201).json({
            "success": true,
            "message":"user created successfully",
            token,
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                language: user.language,
                level: user.level,
                role: user.role,
            }
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            'success': false,
            'message':"db error"
        })
    }
}

export const login = async (req, res) => {
    
    //accept the parameter
    //check the field
    //find the user with email
    //if user is available the compare the hash pwd
    //generate token
    //send token through response with expiration datw

    //return successfull message


    const { email, password } = req.body;
    const normalizedEmail = typeof email === "string" ? normalizeEmail(email) : "";

    if (!normalizedEmail || !password) return res.status(400).json({ "success": false, "message": "all fields are required" });
    if (!isValidEmail(normalizedEmail)) return res.status(400).json({ success: false, message: "invalid email address" });

    try {
        const user = await User.findOne({ email: normalizedEmail }).collation({ locale: "en", strength: 2 }).select('+password');

        if (!user) {
            return res.status(401).json({
                "success": false,
                "message": "invalid credentials"
            })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                "success": false,
                "message": "invalid credentials"
            })
        }

        const token = jwt.sign(
            { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        )

      res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
        
        res.status(200).json({
            "success": true,
            "message": "login successfully",
            token,
            user: {
            id: user._id.toString(),
          email: user.email,
          name: user.name,
          language: user.language,
          level: user.level,
          role: user.role,
            }
      })
    } catch (err) {
        console.log("db error ", err)
        return res.status(500).json({
            "success": false,
            "message": "database error"
        });
    }
}

export const requestPasswordReset = async (req, res) => {
    const email = typeof req.body.email === "string" ? normalizeEmail(req.body.email) : "";

    if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, message: "Enter a valid email address." });
    }

    if (!isPasswordResetEmailConfigured()) {
        return res.status(503).json({
            success: false,
            message: "Password reset email is not configured on the server.",
        });
    }

    try {
        const user = await User.findOne({ email })
            .collation({ locale: "en", strength: 2 })
            .select("+passwordResetCodeRequestedAt +passwordResetCodeAttempts");
        if (user) {
            const now = Date.now();
            const lastRequested = user.passwordResetCodeRequestedAt?.getTime() ?? 0;
            if (now - lastRequested >= 60_000) {
                const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
                user.passwordResetCodeHash = createHmac("sha256", process.env.JWT_SECRET)
                    .update(email + ":" + code)
                    .digest("hex");
                user.passwordResetCodeExpires = new Date(now + 10 * 60 * 1000);
                user.passwordResetCodeAttempts = 0;
                user.passwordResetCodeRequestedAt = new Date(now);
                user.passwordResetTokenHash = undefined;
                user.passwordResetExpires = undefined;
                await user.save();

                try {
                    await sendPasswordResetEmail(user.email, code);
                } catch (emailError) {
                    user.passwordResetCodeHash = undefined;
                    user.passwordResetCodeExpires = undefined;
                    await user.save();
                    console.error("Unable to send password reset code", emailError);
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: "If an account exists for that email, a reset code has been sent.",
        });
    } catch (error) {
        console.error("Password reset request failed", error);
        return res.status(500).json({ success: false, message: "Unable to request a password reset." });
    }
};

export const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    const email = typeof req.body.email === "string" ? normalizeEmail(req.body.email) : "";
    const code = typeof req.body.code === "string" ? req.body.code.trim() : "";
    const hasLegacyToken = typeof token === "string" && Boolean(token);
    const hasValidCodeRequest = isValidEmail(email) && /^\d{6}$/.test(code);
    if ((!hasLegacyToken && !hasValidCodeRequest) || typeof password !== "string" || password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid reset code and a password of at least 6 characters.",
        });
    }

    try {
        let user;
        if (hasValidCodeRequest) {
            user = await User.findOne({
                email,
                passwordResetCodeExpires: { $gt: new Date() },
                passwordResetCodeAttempts: { $lt: 5 },
            }).select("+password +passwordResetCodeHash +passwordResetCodeExpires +passwordResetCodeAttempts");

            const suppliedHash = createHmac("sha256", process.env.JWT_SECRET)
                .update(email + ":" + code)
                .digest("hex");
            const storedHash = user?.passwordResetCodeHash;
            const matches = Boolean(
                storedHash &&
                timingSafeEqual(Buffer.from(suppliedHash, "hex"), Buffer.from(storedHash, "hex")),
            );

            if (!user || !matches) {
                if (user) {
                    user.passwordResetCodeAttempts += 1;
                    if (user.passwordResetCodeAttempts >= 5) {
                        user.passwordResetCodeHash = undefined;
                        user.passwordResetCodeExpires = undefined;
                    }
                    await user.save();
                }
                return res.status(400).json({ success: false, message: "The reset code is invalid or has expired." });
            }
        } else {
            const tokenHash = createHash("sha256").update(token).digest("hex");
            user = await User.findOne({
                passwordResetTokenHash: tokenHash,
                passwordResetExpires: { $gt: new Date() },
            }).select("+password");

            if (!user) {
                return res.status(400).json({ success: false, message: "This reset link is invalid or has expired." });
            }
        }

        user.password = await bcrypt.hash(password, 10);
        user.passwordResetTokenHash = undefined;
        user.passwordResetExpires = undefined;
        user.passwordResetCodeHash = undefined;
        user.passwordResetCodeExpires = undefined;
        user.passwordResetCodeAttempts = 0;
        await user.save();

        return res.status(200).json({ success: true, message: "Password updated. You can now sign in." });
    } catch (error) {
        console.error("Password reset failed", error);
        return res.status(500).json({ success: false, message: "Unable to reset the password." });
    }
};

export const logout = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
    });

    return res.status(200).json({
        success: true,
        message: "logout successfully",
    });
};

export const updateProfile = async (req, res) => {
    const { name, language } = req.body;

    if (Object.hasOwn(req.body, "password")) {
        return res.status(400).json({
            success: false,
            message: "Use the change-password endpoint to update your password.",
        });
    }

    if (!name && language === undefined) {
        return res.status(400).json({
            "success": false,
            "message": "name or language is required"
        });
    }

    const updates = {};
    if (name) updates.name = name;
    if (language !== undefined) {
        const languages = normalizeLanguages(language, []);
        if (!languages) {
            return res.status(400).json({
                success: false,
                message: "language contains an unsupported code"
            });
        }
        updates.language = languages;
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        ).select("name email language role");

        if (!updatedUser) {
            return res.status(404).json({
                "success": false,
                "message": "user not found"
            })
        }

        return res.status(200).json({
            "success": true,
            "message": "profile updated successfully",
            user: {
                id: updatedUser._id.toString(),
                email: updatedUser.email,
                name: updatedUser.name,
                language: updatedUser.language,
                role: updatedUser.role,
            }
        })
    } catch (err) {
        console.log("db error ", err)
        return res.status(500).json({
            "success": false,
            "message": "database error"
        });
    }
}

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (
        typeof currentPassword !== "string" ||
        !currentPassword ||
        typeof newPassword !== "string" ||
        newPassword.length < 6
    ) {
        return res.status(400).json({
            success: false,
            message: "Enter your current password and a new password of at least 6 characters.",
        });
    }

    try {
        const user = await User.findById(req.user.id).select("+password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const currentPasswordMatches = await bcrypt.compare(currentPassword, user.password);
        if (!currentPasswordMatches) {
            return res.status(401).json({ success: false, message: "Current password is incorrect." });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.status(200).json({ success: true, message: "Password updated successfully." });
    } catch (error) {
        console.error("Password change failed", error);
        return res.status(500).json({ success: false, message: "Unable to update your password." });
    }
};

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("name email nationality language level role");

        if (!user) {
            return res.status(404).json({
                "success": false,
                "message": "user not found"
            })
        }

        return res.status(200).json({
            "success": true,
            "message": "profile fetched successfully",
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                nationality: user.nationality,
                language: user.language,
                level: user.level,
                role: user.role,
            }
        })
    } catch (err) {
        console.log("db error ", err)
        return res.status(500).json({
            "success": false,
            "message": "database error"
        });
    }
}
