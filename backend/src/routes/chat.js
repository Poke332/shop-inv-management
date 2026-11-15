import { Router } from 'express'
import { optionalAuth } from '../middleware/auth.js'
import { rateLimit } from '../services/rateLimit.js'
import { runChat } from '../services/chat/agent.js'
import { normalizeMessages } from '../services/chat/messages.js'
import { buildSystemPrompt } from '../services/chat/systemPrompt.js'
import { toolDefinitions, executeTool } from '../services/chat/tools.js'
import { createOpenAICompatibleClient } from '../services/chat/openaiCompatible.js'
import { createAnthropicClient } from '../services/chat/anthropicAdapter.js'

const router = Router()

// CHAT_PROVIDER picks the LLM backend: "openai" (default — the main provider,
// any OpenAI-compatible /v1 host: OpenAI, OpenRouter, self-hosted) or
// "anthropic" (optional, extra support). OpenRouter is reached through the
// "openai" provider by pointing OPENAI_BASE_URL at
// https://openrouter.ai/api/v1. Any other value is unrecognized and answers
// 503 CHAT_UNAVAILABLE (see .env.example / CHATBOT.md).
const provider = () => (process.env.CHAT_PROVIDER || 'openai').toLowerCase()
const defaultModels = { anthropic: 'claude-haiku-5-5', openai: 'gpt-4o-mini' }
const model = () => process.env.CHAT_MODEL || defaultModels[provider()]

// The client is rebuilt per request so the env config is always what this
// process was given; the rate limiter caps how often that happens.
function getClient() {
  const name = provider()
  if (name === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    // The SDK reads ANTHROPIC_API_KEY (and ANTHROPIC_BASE_URL) from the environment.
    return createAnthropicClient()
  }
  if (name === 'openai') {
    // OPENAI_* vars drive the endpoint; both are required — OPENAI_BASE_URL
    // points at any OpenAI-compatible /v1 host (OpenAI main endpoint, OpenRouter,
    // self-hosted vLLM/Ollama).
    const apiKey = process.env.OPENAI_API_KEY
    const baseURL = process.env.OPENAI_BASE_URL
    if (apiKey && baseURL) return createOpenAICompatibleClient({ apiKey, baseURL })
  }
  return null
}

const limiter = rateLimit({ limit: Number(process.env.CHAT_RATE_LIMIT_PER_MIN) || 20, windowMs: 60_000 })

// Open to guests (the catalog is public); a valid token only tailors the app-help answers to the user's role.
router.post('/', limiter, optionalAuth, async (req, res) => {
  const messages = normalizeMessages(req.body?.messages)
  const client = getClient()
  if (!client) {
    // The openai provider without a base URL names both required vars; every
    // other not-configured state (missing key, unknown provider) keeps the
    // generic message.
    const baseUnset = provider() === 'openai' && process.env.OPENAI_API_KEY && !process.env.OPENAI_BASE_URL
    return res.status(503).json({
      message: baseUnset ? 'The assistant is not configured yet. Set OPENAI_BASE_URL and OPENAI_API_KEY in the environment.' : 'The assistant is not configured yet.',
      code: 'CHAT_UNAVAILABLE',
    })
  }
  try {
    const result = await runChat({
      client,
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
