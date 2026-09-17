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
            maxlength: 40,
        },
        password: {
            type: String,
            required: true,
            select: false,
            minlength:[6,"password must be greater that 6 chracter"],
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

    },
    { timestamps: true }
)

const User = mongoose.model('User', userSchema)

export default User;
