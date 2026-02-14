// Message Schema for MongoDB - Stores individual messages in a chat
import mongoose, { Schema, Document } from "mongoose";

// Interface defining the structure of a Message document
export interface IMessage extends Document {
    _id: mongoose.Types.ObjectId; // MongoDB unique identifier
    chat: mongoose.Types.ObjectId; // Reference to the Chat document
    sender: mongoose.Types.ObjectId; // Reference to the User who sent the message
    senderName: string; // Sender's display name (for quick access)
    senderEmail: string; // Sender's email (non-identifying to show username instead)
    content: string; // The actual message text content
    isRead: boolean; // Flag indicating if message has been read by recipient
    readAt?: Date; // Timestamp when message was read
    createdAt: Date; // Timestamp when message was created
    updatedAt: Date; // Timestamp when message was last edited/updated
}

// Create Message schema with specified fields
const messageSchema = new Schema<IMessage>(
    {
        // Reference to the Chat this message belongs to
        // Deleted messages cascade to user's chats
        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
            required: true,
            index: true, // Index for fast queries by chat ID
        },

        // Reference to the User who sent this message
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true, // Index for fast queries by sender
        },

        // Sender's name stored for display (denormalized for performance)
        // Allows showing username even if user account is deleted
        senderName: {
            type: String,
            required: true,
        },

        // Sender's email address (not displayed in UI, for identification)
        senderEmail: {
            type: String,
            required: true,
        },

        // The actual message text content
        content: {
            type: String,
            required: true,
            trim: true, // Remove unnecessary whitespace
        },

        // Flag indicating if recipient has read the message
        isRead: {
            type: Boolean,
            default: false,
        },

        // Timestamp when the message was read by recipient
        readAt: {
            type: Date,
            default: null,
        },
    },
    {
        // Automatically manage createdAt and updatedAt fields
        timestamps: true,
    }
);

// Create compound index on chat and sender for filtering messages by chat/sender
messageSchema.index({ chat: 1, createdAt: -1 }); // Sort messages by date

// Create and export Message model
export default mongoose.model<IMessage>("Message", messageSchema);
