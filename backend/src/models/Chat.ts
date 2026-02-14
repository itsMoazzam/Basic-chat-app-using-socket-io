// Chat Schema for MongoDB - Stores information about conversations between users
import mongoose, { Schema, Document } from "mongoose";

// Interface defining the structure of a Chat/Conversation document
export interface IChat extends Document {
    _id: mongoose.Types.ObjectId; // MongoDB unique identifier
    participants: mongoose.Types.ObjectId[]; // Array of user IDs involved in the chat
    participantEmails: string[]; // Array of emails for easy lookup
    lastMessage?: string; // Content of the last message in this chat
    lastMessageTime?: Date; // Timestamp of the last message
    lastMessageSender?: mongoose.Types.ObjectId; // ID of user who sent last message
    createdAt: Date; // When the chat was first created
    updatedAt: Date; // When the chat was last updated
}

// Create Chat schema with specified fields
const chatSchema = new Schema<IChat>(
    {
        // Array of participant user IDs (minimum 2 for one-to-one chat)
        participants: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "User", // Reference to User model
            required: true,
            validate: {
                validator: function (arr: mongoose.Types.ObjectId[]) {
                    // Ensure at least 2 participants for a chat
                    return arr.length >= 2;
                },
                message: "Chat must have at least 2 participants",
            },
        },

        // Array of participant emails for quick user lookup without joining
        participantEmails: {
            type: [String],
            required: true,
        },

        // Last message content for quick preview in chat list
        lastMessage: {
            type: String,
            default: null,
        },

        // Timestamp of the last message (used for sorting chats)
        lastMessageTime: {
            type: Date,
            default: null,
        },

        // ID of the user who sent the last message
        lastMessageSender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        // Automatically manage createdAt and updatedAt fields
        timestamps: true,
    }
);

// Create unique compound index on participants to prevent duplicate chats
// This ensures only one chat exists between a pair of users
chatSchema.index({ participants: 1 }, { unique: true });

// Create and export Chat model
export default mongoose.model<IChat>("Chat", chatSchema);
