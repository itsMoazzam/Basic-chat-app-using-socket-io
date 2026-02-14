// User Schema for MongoDB - Defines structure of user documents
import mongoose, { Schema, Document } from "mongoose";

// Interface defining the structure of a User document
export interface IUser extends Document {
    _id: mongoose.Types.ObjectId; // MongoDB unique identifier
    name: string; // User's display name
    email: string; // User's email address (unique)
    password?: string; // Hashed password (optional for OAuth users)
    avatar?: string; // User's profile picture URL
    isBlocked: boolean; // Flag to check if user is blocked by admin
    googleId?: string; // Google OAuth ID (for Gmail login)
    role: "user" | "admin"; // User role - either 'user' or 'admin'
    createdAt: Date; // Timestamp when user account was created
    updatedAt: Date; // Timestamp when user account was last updated
    isOnline?: boolean; // Real-time online status (not stored in DB)
    lastSeen?: Date; // Last time user was online
}

// Create User schema with specified fields and validations
const userSchema = new Schema<IUser>(
    {
        // User's full name - required field, string type
        name: {
            type: String,
            required: true,
            trim: true, // Remove leading/trailing whitespace
        },

        // User's email address - required, unique, and converted to lowercase
        email: {
            type: String,
            required: true,
            unique: true, // Ensures no two users have same email
            trim: true,
            lowercase: true, // Convert to lowercase for consistency
        },

        // Hashed password - optional as OAuth users don't have password
        password: {
            type: String,
            select: false, // Don't include password in queries by default
        },

        // User's profile avatar URL
        avatar: {
            type: String,
            default: null,
        },

        // Admin blocking status - if true, user cannot login
        isBlocked: {
            type: Boolean,
            default: false,
        },

        // Google OAuth ID for Gmail authentication
        googleId: {
            type: String,
            default: null,
        },

        // User role - defaults to 'user', can be 'admin'
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },

        // Last login timestamp
        lastSeen: {
            type: Date,
            default: null,
        },
    },
    {
        // Automatically add createdAt and updatedAt timestamps
        timestamps: true,
    }
);

// Create and export User model using the schema
export default mongoose.model<IUser>("User", userSchema);
