/**
 * Adapter that lets the chat agent talk to any OpenAI-compatible
 * /chat/completions endpoint (OpenRouter, and many free or self-hosted models)
 * while the rest of the code keeps using the Anthropic message shape.
 *
 * It exposes the same `client.messages.create(...)` call the agent uses and
 * translates in both directions:
 *   - tools            -> {type: 'function', function: {name, description, parameters}}
 *   - tool_use blocks  -> assistant `tool_calls`
 *   - tool_result      -> role "tool" messages
 * and maps the reply back to text / tool_use blocks with an Anthropic-style stop_reason.
 */

function toOpenAIMessages(system, messages) {
  const out = [{ role: 'system', content: system }]
  for (const message of messages) {
    if (typeof message.content === 'string') {
      out.push({ role: message.role, content: message.content })
    } else if (message.role === 'assistant') {
      const text = message.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
      const calls = message.content.filter(b => b.type === 'tool_use').map(b => ({
        id: b.id, type: 'function', function: { name: b.name, arguments: JSON.stringify(b.input ?? {}) },
      }))
      out.push({ role: 'assistant', content: text, ...(calls.length ? { tool_calls: calls } : {}) })
    } else {
      for (const block of message.content) {
        if (block.type === 'tool_result') out.push({ role: 'tool', tool_call_id: block.tool_use_id, content: block.content })
      }
    }
  }
  return out
}

function parseArguments(raw) {
  try { return raw ? JSON.parse(raw) : {} } catch { return {} }
}

/**
 * @param {{apiKey: string, baseURL: string, timeoutMs?: number}} options
 * @returns {{messages: {create: Function}}} an Anthropic-shaped client.
 */
export function createOpenAICompatibleClient({ apiKey, baseURL, timeoutMs = 45_000 }) {
  return {
    messages: {
      async create({ model, max_tokens, system, tools, messages }) {
        const response = await fetch(baseURL.replace(/\/$/, '') + '/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            max_tokens,
            messages: toOpenAIMessages(system, messages),
            ...(tools?.length ? {
              tools: tools.map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.input_schema } })),
            } : {}),
          }),
          signal: AbortSignal.timeout(timeoutMs),
        })
        const raw = await response.text()
        let data
        try { data = JSON.parse(raw) } catch { data = null }
        // OpenRouter can also report failures as a 200 with an `error` object.
        if (!response.ok || data?.error || !data?.choices?.[0]) {
          const status = response.ok ? Number(data?.error?.code) || 502 : response.status
          throw Object.assign(new Error(`LLM provider error ${status}: ${(data?.error?.message || raw).slice(0, 300)}`), { status })
        }
        const message = data.choices[0].message || {}
        const calls = Array.isArray(message.tool_calls) ? message.tool_calls : []
        const content = []
        if (typeof message.content === 'string' && message.content.trim()) content.push({ type: 'text', text: message.content })
        for (const call of calls) {
          content.push({ type: 'tool_use', id: call.id, name: call.function?.name, input: parseArguments(call.function?.arguments) })
        }
        return { content, stop_reason: calls.length ? 'tool_use' : 'end_turn' }
      },
    },
  }
}
