/**
 * Adapter that wraps the @anthropic-ai/sdk client so the chat agent can use
 * the same OpenAI-shaped interface as openaiCompatible.js.
 *
 * This backs the `anthropic` provider in routes/chat.js; the SDK reads
 * ANTHROPIC_API_KEY (and the optional ANTHROPIC_BASE_URL) from the
 * environment. This module is the only place that converts between the
 * canonical OpenAI shape and the Anthropic wire format, in both directions:
 *   - OpenAI function tools        -> {name, description, input_schema}
 *   - assistant `tool_calls`       -> `tool_use` content blocks
 *   - `role: 'tool'` messages      -> `tool_result` blocks (consecutive ones
 *                                     merged into a single user message, which
 *                                     the Anthropic API requires)
 * and maps the reply back to {message, finish_reason}.
 */

import Anthropic from '@anthropic-ai/sdk'

function parseArguments(raw) {
  try { return raw ? JSON.parse(raw) : {} } catch { return {} }
}

function toAnthropicMessages(messages) {
  const out = []
  let toolResults = []
  const flush = () => {
    if (toolResults.length) out.push({ role: 'user', content: toolResults })
    toolResults = []
  }
  for (const message of messages) {
    if (message.role === 'tool') {
      toolResults.push({ type: 'tool_result', tool_use_id: message.tool_call_id, content: message.content })
      continue
    }
    flush()
    if (message.role === 'assistant' && Array.isArray(message.tool_calls)) {
      const blocks = []
      const text = typeof message.content === 'string' ? message.content.trim() : ''
      if (text) blocks.push({ type: 'text', text })
      for (const call of message.tool_calls) {
        blocks.push({ type: 'tool_use', id: call.id, name: call.function?.name, input: parseArguments(call.function?.arguments) })
      }
      out.push({ role: 'assistant', content: blocks })
    } else {
      out.push({ role: message.role, content: message.content })
    }
  }
  flush()
  return out
}

/**
 * @param {{timeoutMs?: number}} options
 * @returns {{messages: {create: Function}}} an OpenAI-shaped client backed by the Anthropic SDK.
 */
export function createAnthropicClient({ timeoutMs = 30_000 } = {}) {
  const anthropic = new Anthropic({ timeout: timeoutMs })
  return {
    messages: {
      async create({ model, max_tokens, system, tools, messages }) {
        let response
        try {
          response = await anthropic.messages.create({
            model,
            max_tokens,
            messages: toAnthropicMessages(messages),
            ...(system ? { system } : {}),
            ...(tools?.length ? {
              tools: tools.map(tool => ({
                name: tool.function?.name,
                description: tool.function?.description,
                input_schema: tool.function?.parameters ?? { type: 'object', properties: {} },
              })),
            } : {}),
          })
        } catch (error) {
          const status = error.status || 502
          throw Object.assign(new Error(`LLM provider error ${status}: ${String(error.message || error).slice(0, 300)}`), { status })
        }
        const text = response.content.filter(block => block.type === 'text').map(block => block.text).join('\n')
        const calls = response.content.filter(block => block.type === 'tool_use').map(block => ({
          id: block.id,
          type: 'function',
          function: { name: block.name, arguments: JSON.stringify(block.input ?? {}) },
        }))
        return {
          message: { role: 'assistant', content: text, ...(calls.length ? { tool_calls: calls } : {}) },
          finish_reason: response.stop_reason === 'tool_use' ? 'tool_calls' : 'stop',
        }
      },
    },
  }
}
