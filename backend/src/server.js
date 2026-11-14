import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { authRouter } from './routes/auth.js'
import { projectsRouter } from './routes/projects.js'
import { aiRouter } from './routes/ai.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dramatone'

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Dramatone Audio Engine API',
    mongoConnected: mongoose.connection.readyState === 1
  })
})

// Mount Routes
app.use('/api/auth', authRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/ai', aiRouter)

// Start Server
app.listen(PORT, () => {
  console.log(`🎛️  Dramatone Studio API running on http://localhost:${PORT}`)

  // Attempt MongoDB Connection (Non-blocking)
  if (process.env.MONGODB_URI || process.env.NODE_ENV !== 'production') {
    mongoose
      .connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 })
      .then(() => console.log('🍃 Connected to MongoDB successfully!'))
      .catch((err) => {
        console.warn('⚠️  MongoDB connection notice:', err.message)
        console.warn('ℹ️  Frontend will automatically use local storage cache if MongoDB is offline.')
      })
  }
})

