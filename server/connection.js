import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/user.js";
dotenv.config();

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log('Connected to MongoDB');

        // Auto migration: Add isActive field to existing users
        try {
            console.log(' Running migration...');
            const result = await User.updateMany(
                { isActive: { $exists: false } },
                { $set: { isActive: true } }
            );
            console.log(` Migration complete: Updated ${result.modifiedCount} users, Matched ${result.matchedCount} users`);

            // Log stats
            const totalUsers = await User.countDocuments({});
            const activeUsers = await User.countDocuments({ isActive: true });
            const inactiveUsers = await User.countDocuments({ isActive: false });
            console.log(`Users: Total=${totalUsers}, Active=${activeUsers}, Inactive=${inactiveUsers}`);
        } catch (migrationError) {
            console.log('  Migration warning:', migrationError.message);
        }
    } catch (error) {
        console.log('Error connecting to MongoDB')
    }
}