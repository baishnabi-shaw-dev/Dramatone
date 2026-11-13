import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  genre: {
    type: String,
    default: 'Synthwave'
  },
  mood: {
    type: String,
    default: 'Euphoric'
  },
  bpm: {
    type: Number,
    default: 118
  },
  tension: {
    type: Number,
    default: 50
  },
  stems: [
    {
      id: String,
      name: String,
      volume: Number,
      muted: Boolean,
      solo: Boolean
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export const Project = mongoose.model('Project', projectSchema)

