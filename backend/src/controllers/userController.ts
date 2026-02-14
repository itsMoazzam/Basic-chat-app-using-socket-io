// User Controller - Handles user operations and admin user management
import { Request, Response } from "express";
import User from "../models/User";

// Controller to get all users with optional search and filtering
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        // Get search query from request (for finding users by name/email)
        const { search } = req.query;

        // Initialize filter object for MongoDB query
        let filter: any = {};

        // If search query provided, search by name or email using regex
        if (search && typeof search === "string") {
            // $or operator: matches if either name or email matches
            // $regex: uses regular expression pattern matching
            // $options: "i" makes search case-insensitive
            filter = {
                $or: [
                    { name: { $regex: search, $options: "i" } }, // Case-insensitive name search
                    { email: { $regex: search, $options: "i" } }, // Case-insensitive email search
                ],
            };
        }

        // Query database for users matching filter
        // select excludes sensitive fields: doesn't include password
        const users = await User.find(filter)
            .select("-password") // Don't return password hashes
            .limit(50); // Limit results to 50 users for performance

        // Return success response with users list
        res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            users: users.map((user) => ({
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                isBlocked: user.isBlocked,
                lastSeen: user.lastSeen,
            })),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching users",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Controller to get single user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        // Get user ID from URL parameters
        const { id } = req.params;

        // Find user by ID in database
        const user = await User.findById(id).select("-password");

        // If user not found, return 404 error
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }

        // Return user data
        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                isBlocked: user.isBlocked,
                lastSeen: user.lastSeen,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching user",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Controller for admin to block a user
// Blocked users cannot login to the application
export const blockUser = async (req: Request, res: Response): Promise<void> => {
    try {
        // Get user ID to block from URL parameters
        const { id } = req.params;

        // Find user by ID
        const user = await User.findById(id);

        // If user not found, return 404 error
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }

        // Prevent blocking admin accounts
        if (user.role === "admin") {
            res.status(403).json({
                success: false,
                message: "Cannot block admin users",
            });
            return;
        }

        // Set isBlocked flag to true
        user.isBlocked = true;

        // Save updated user to database
        await user.save();

        // Return success response
        res.status(200).json({
            success: true,
            message: `User ${user.name} has been blocked`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isBlocked: user.isBlocked,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error blocking user",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Controller for admin to unblock a user
// Allows blocked user to login again
export const unblockUser = async (req: Request, res: Response): Promise<void> => {
    try {
        // Get user ID to unblock from URL parameters
        const { id } = req.params;

        // Find user by ID
        const user = await User.findById(id);

        // If user not found, return 404 error
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }

        // Set isBlocked flag to false
        user.isBlocked = false;

        // Save updated user to database
        await user.save();

        // Return success response
        res.status(200).json({
            success: true,
            message: `User ${user.name} has been unblocked`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isBlocked: user.isBlocked,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error unblocking user",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Controller to get all users with their blocking status (for admin dashboard)
export const getAllUsersForAdmin = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        // Query all users with key admin fields
        const users = await User.find({})
            .select("-password") // Exclude password
            .sort({ createdAt: -1 }); // Sort by newest first

        // Return users with formatting for admin view
        res.status(200).json({
            success: true,
            totalUsers: users.length, // Total user count
            users: users.map((user) => ({
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                isBlocked: user.isBlocked,
                createdAt: user.createdAt,
                lastSeen: user.lastSeen,
            })),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching users",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Controller to delete a user (admin only, soft delete conceptually)
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        // Get user ID from URL parameters
        const { id } = req.params;

        // Security check: prevent deleting admin accounts
        const user = await User.findById(id);

        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }

        // Prevent deleting admin users
        if (user.role === "admin") {
            res.status(403).json({
                success: false,
                message: "Cannot delete admin users",
            });
            return;
        }

        // Delete user from database
        await User.findByIdAndDelete(id);

        // Return success response
        res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting user",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
