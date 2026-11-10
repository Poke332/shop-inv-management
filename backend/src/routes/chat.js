import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { optionalAuth } from '../middleware/auth.js'
import { rateLimit } from '../services/rateLimit.js'
import { runChat } from '../services/chat/agent.js'
import { normalizeMessages } from '../services/chat/messages.js'
import { buildSystemPrompt } from '../services/chat/systemPrompt.js'
import { toolDefinitions, executeTool } from '../services/chat/tools.js'
import { createOpenAICompatibleClient } from '../services/chat/openaiCompatible.js'

const router = Router()

// CHAT_PROVIDER picks the LLM backend: "anthropic" (default) or "openrouter" (free models available).
const provider = () => (process.env.CHAT_PROVIDER || 'anthropic').toLowerCase()
const defaultModels = { anthropic: 'claude-haiku-5-5', openrouter: 'openrouter/free' }
const model = () => process.env.CHAT_MODEL || defaultModels[provider()]

const clients = new Map()
function getClient() {
  const name = provider()
  if (clients.has(name)) return clients.get(name)
  let created = null
  if (name === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    // The SDK reads ANTHROPIC_API_KEY (and ANTHROPIC_BASE_URL) from the environment.
    created = new Anthropic({ timeout: 30_000 })
  } else if (name === 'openrouter' && process.env.OPENROUTER_API_KEY) {
    created = createOpenAICompatibleClient({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    })
  }
  if (created) clients.set(name, created)
  return created
}

const limiter = rateLimit({ limit: Number(process.env.CHAT_RATE_LIMIT_PER_MIN) || 20, windowMs: 60_000 })

// Open to guests (the catalog is public); a valid token only tailors the app-help answers to the user's role.
router.post('/', limiter, optionalAuth, async (req, res) => {
  const messages = normalizeMessages(req.body?.messages)
  const anthropic = getClient()
  if (!anthropic) {
    return res.status(503).json({ message: 'The assistant is not configured yet.', code: 'CHAT_UNAVAILABLE' })
  }
  try {
    const result = await runChat({
      client: anthropic,
      model: model(),
      system: buildSystemPrompt(req.user || null),
      tools: toolDefinitions,
      executeTool,
      messages,
    })
    res.json(result)
  } catch (error) {
    console.error('chat request failed:', error.status ?? '', error.message)
    const busy = error.status === 429 || error.status === 529
    res.status(503).json({
      message: busy ? 'The assistant is busy. Please try again in a moment.' : 'The assistant is unavailable right now.',
      code: 'CHAT_UNAVAILABLE',
    })
  }
})

export default router
