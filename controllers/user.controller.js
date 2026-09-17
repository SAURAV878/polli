import User from "../models/user.model.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const supportedLanguages = ["de", "fr", "en", "es", "it", "pt", "ja", "ko", "zh", "ar"];

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

    //check any field is empty
    //check the user with email exists or not
    // if not exist hashed the password
    // create the user
    //return a successfull response

    if (!name || !nationality || !email || !password)
    {
       return res.status(400).json({
            'success': false,
            'message':"all fields are required"
        })
}

    if (!languages) {
        return res.status(400).json({
            success: false,
            message: "language contains an unsupported code"
        });
    }

  
    try {
        const existingUser = await User.findOne({ email: email});
        if (existingUser) {
            return res.status(409).json({
                "success": false,
                "message":"user already exists"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            nationality,
            email: email,
            password: hashedPassword,
            language: languages,
        })

        const token = jwt.sign(
            { id: user._id.toString(), email: user.email, name: user.name },
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

    if (!email || !password) return res.status(400).json({ "success": false, "message": "all fields are required" });

    try {
        const user = await User.findOne({ email: email }).select('+password');

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
            { id: user._id.toString(), email: user.email, name: user.name },
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
    const { name, password, language } = req.body;

    if (!name && !password && language === undefined) {
        return res.status(400).json({
            "success": false,
            "message": "name, password, or language is required"
        });
    }

    if (password && password.length < 6) {
        return res.status(400).json({
            "success": false,
            "message": "password must be at least 6 characters"
        });
    }

    const updates = {};
    if (name) updates.name = name;
    if (password) updates.password = await bcrypt.hash(password, 10);
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
        ).select("name email language");

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
                language: updatedUser.language
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

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("name email nationality language level");

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
                level: user.level
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
