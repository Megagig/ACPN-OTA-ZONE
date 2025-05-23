import mongoose, { Schema, Document } from 'mongoose';

export interface ICandidate extends Document {
  electionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  position: string;
  manifesto: string;
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const candidateSchema = new Schema<ICandidate>(
  {
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Election',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      trim: true,
    },
    manifesto: {
      type: String,
      required: [true, 'Manifesto is required'],
    },
    photoUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for votes
candidateSchema.virtual('votes', {
  ref: 'Vote',
  localField: '_id',
  foreignField: 'candidateId',
  justOne: false,
  count: true,
});

// Ensure a user can only be a candidate once per position in an election
candidateSchema.index(
  { electionId: 1, userId: 1, position: 1 },
  { unique: true }
);

const Candidate = mongoose.model<ICandidate>('Candidate', candidateSchema);

export default Candidate;
