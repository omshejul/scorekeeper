import mongoose, { Schema, Document } from "mongoose";

export interface IPlayer {
  id: string;
  name: string;
  score: number;
  color: string;
}

export interface IGame extends Document {
  id: string;
  name: string;
  players: IPlayer[];
  createdAt: Date;
  lastPlayed: Date;
  userId: string; // Associate games with specific users
  userName: string; // User's display name from Google
  userEmail: string; // User's email from Google
  isShared: boolean; // Whether this game is shared
  sharedWith: string[]; // Array of user emails who have access
  shareCode: string; // Unique code for sharing
  sharedBy: string; // Email of user who shared it
}

const PlayerSchema = new Schema<IPlayer>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  score: { type: Number, required: true, default: 0 },
  color: { type: String, required: true },
});

const GameSchema = new Schema<IGame>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    players: [PlayerSchema],
    createdAt: { type: Date, default: Date.now },
    lastPlayed: { type: Date, default: Date.now },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    isShared: { type: Boolean, default: false },
    sharedWith: [{ type: String }], // Array of user emails
    shareCode: { type: String, unique: true, sparse: true },
    sharedBy: { type: String }, // Email of user who shared
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
GameSchema.index({ userId: 1, lastPlayed: -1 });
GameSchema.index({ userEmail: 1 });
GameSchema.index({ sharedWith: 1 });

export default mongoose.models.Game ||
  mongoose.model<IGame>("Game", GameSchema);
