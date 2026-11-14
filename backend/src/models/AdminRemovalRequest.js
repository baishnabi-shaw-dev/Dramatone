import mongoose from 'mongoose'

const adminRemovalRequestSchema = new mongoose.Schema({
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  targetName: {
    type: String,
    required: true
  },
  requestedByEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  requestedByName: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date,
    default: null
  }
})

export const AdminRemovalRequest = mongoose.models.AdminRemovalRequest || mongoose.model('AdminRemovalRequest', adminRemovalRequestSchema)

