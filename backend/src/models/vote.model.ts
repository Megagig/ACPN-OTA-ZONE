import mongoose, { Schema, Document } from 'mongoose';

export interface IVote extends Document {
  electionId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  voterId: mongoose.Types.ObjectId;
  voteTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

const voteSchema = new Schema<IVote>(
  {
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Election',
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
    },
    voterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    voteTime: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only vote once for a specific position in an election
voteSchema.index(
  { electionId: 1, voterId: 1, candidateId: 1 },
  { unique: true }
);

const Vote = mongoose.model<IVote>('Vote', voteSchema);

export default Vote;
