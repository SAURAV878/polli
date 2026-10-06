import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/user.model.js";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
    console.error("Usage: npm run make-admin -- <existing-account-email>");
    process.exitCode = 1;
} else if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing. Set it in polli/.env first.");
    process.exitCode = 1;
} else {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOneAndUpdate(
            { email },
            { $set: { role: "admin" } },
            { new: true, runValidators: true },
        ).select("name email role");

        if (!user) {
            console.error(`No Polli account found for ${email}. Create the account first.`);
            process.exitCode = 1;
        } else {
            console.log(`Admin access enabled for ${user.email} (${user.name}).`);
            console.log("Sign out and sign back in to refresh the account's role in its login token.");
        }
    } catch (error) {
        console.error("Unable to grant admin access:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}
