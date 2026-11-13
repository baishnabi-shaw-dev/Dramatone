import express from 'express'
import { Project } from '../models/Project.js'
import { authenticateToken } from '../middleware/auth.js'

export const projectsRouter = express.Router()

// Get all projects for logged-in user (or recent public projects)
projectsRouter.get('/', async (req, res) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    let query = {}
    if (token) {
      try {
        const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
        if (decoded?.id) {
          query = { userId: decoded.id }
        }
      } catch {
        // Continue with default
      }
    }

    const projects = await Project.find(query).sort({ createdAt: -1 }).limit(20)
    res.json(projects)
  } catch (err) {
    console.error('Fetch projects error:', err)
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

// Save / Create a new soundscape project
projectsRouter.post('/', async (req, res) => {
  try {
    const { title, genre, mood, bpm, tension, stems } = req.body

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    let userId = null

    if (token) {
      try {
        const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
        userId = decoded?.id || null
      } catch {
        // Optional user
      }
    }

    const project = new Project({
      userId,
      title: title || 'Untitled Soundscape',
      genre: genre || 'Custom',
      mood: mood || 'Neutral',
      bpm: bpm || 100,
      tension: tension !== undefined ? tension : 50,
      stems: stems || []
    })

    await project.save()
    res.status(201).json(project)
  } catch (err) {
    console.error('Save project error:', err)
    res.status(500).json({ error: 'Failed to save project' })
  }
})

// Delete a project
projectsRouter.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Project deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

