import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 20,
        },
        nationality: {
            type: String,
            required: true,
            trim: true,
            maxlength: 40,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            maxlength: 40,
        },
        password: {
            type: String,
            required: true,
            select: false,
            minlength:[6,"password must be greater that 6 chracter"],
        },
        passwordResetTokenHash: {
            type: String,
            select: false,
        },
        passwordResetExpires: {
            type: Date,
            select: false,
        },
        passwordResetCodeHash: {
            type: String,
            select: false,
        },
        passwordResetCodeExpires: {
            type: Date,
            select: false,
        },
        passwordResetCodeAttempts: {
            type: Number,
            default: 0,
            select: false,
        },
        passwordResetCodeRequestedAt: {
            type: Date,
            select: false,
        },

        language: {
            type: [String],
            required: true,
            enum: ["de", "fr", "en", "es", "it", "pt", "ja", "ko", "zh", "ar"],
            trim: true,
            maxlength: 20,
        },
        level: {
            type: String,
            required: true,
            trim: true,
            maxlength: 20,
            default:'A1'
        },
        role: {
            type: String,
            enum: ["learner", "admin"],
            default: "learner",
            required: true,
        },

    },
    { timestamps: true }
)

const User = mongoose.model('User', userSchema)

export default User;
