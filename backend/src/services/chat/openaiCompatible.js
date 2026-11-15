/**
 * Adapter that lets the chat agent talk to any OpenAI-compatible
 * /chat/completions endpoint (OpenAI, OpenRouter, and self-hosted /v1 hosts).
 *
 * This backs the `openai` provider in routes/chat.js; `OPENAI_BASE_URL` points
 * it at the host (OpenRouter: https://openrouter.ai/api/v1).
 *
 * The agent already speaks the OpenAI wire shape (the app's canonical format),
 * so this adapter is a straight pass-through: it sends `tools`, assistant
 * `tool_calls` and `role: 'tool'` messages exactly as the agent produces them
 * and returns the provider's raw `choices[0]` ({message, finish_reason}).
 * No shape translation happens here — anthropicAdapter.js is the only place
 * that translates between the canonical shape and another wire format.
 */

/**
 * @param {{apiKey: string, baseURL: string, timeoutMs?: number}} options
 * @returns {{messages: {create: Function}}} an OpenAI-shaped client.
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
            messages: [{ role: 'system', content: system }, ...messages],
            ...(tools?.length ? { tools } : {}),
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
        return data.choices[0]
      },
    },
  }
}
