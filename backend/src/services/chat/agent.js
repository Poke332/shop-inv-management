/**
 * The tool-use loop: send the conversation to the model, run any tools it asks
 * for, feed the results back, and repeat until it answers in plain text.
 *
 * It is deliberately independent of the database and of the Express layer: the
 * client and the tool executor are injected, so the loop can be unit-tested
 * with fakes and the route stays a thin HTTP wrapper.
 *
 * The loop speaks the OpenAI tool-calling vocabulary (the app's canonical
 * shape): assistant turns carry `tool_calls`, results are appended as
 * `role: 'tool'` messages keyed by `tool_call_id`, and the request stops when
 * the reply has no tool calls. Provider adapters translate this shape to
 * their wire formats (see anthropicAdapter.js / openaiCompatible.js).
 */

const MAX_TOOL_RESULT_CHARS = 12000

const DEFAULT_MAX_TOOL_CALLS = 6

// CHAT_MAX_TOOL_CALLS overrides the tool-use cap; anything that is not a
// finite integer > 0 (unset, empty, non-numeric, decimal, negative) keeps
// the default.
function maxToolCalls() {
  const value = Number(process.env.CHAT_MAX_TOOL_CALLS)
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_MAX_TOOL_CALLS
}

const FALLBACK_REPLY = 'Sorry, I could not finish that request. Please try rephrasing your question.'

function serialise(result) {
  const text = JSON.stringify(result)
  return text.length > MAX_TOOL_RESULT_CHARS ? text.slice(0, MAX_TOOL_RESULT_CHARS) + '…[truncated]' : text
}

function parseArguments(raw) {
  try { return raw ? JSON.parse(raw) : {} } catch { return {} }
}

/**
 * @param {object} options
 * @param {{messages: {create: Function}}} options.client  OpenAI-shaped provider client (or a compatible fake):
 * takes {model, max_tokens, system, tools, messages} and resolves to {message, finish_reason}.
 * @param {string} options.model  model id.
 * @param {string} options.system  system prompt.
 * @param {object[]} options.tools  tool definitions (OpenAI function-tool shape).
 * @param {(name: string, input: object) => Promise<object>} options.executeTool  runs one tool call.
 * @param {{role: 'user'|'assistant', content: string}[]} options.messages  the conversation so far (ends with a user turn).
 * @param {number} [options.maxSteps]  cap on model calls per turn, so a misbehaving loop cannot run forever.
 *   When omitted, CHAT_MAX_TOOL_CALLS applies (a finite integer > 0; unset or invalid values keep the default of 6).
 * @param {number} [options.maxTokens]  output cap per model call.
 * @returns {Promise<{reply: string, toolsUsed: string[]}>}
 */
export async function runChat({ client, model, system, tools, executeTool, messages, maxSteps = maxToolCalls(), maxTokens = 1024 }) {
  const conversation = messages.map(({ role, content }) => ({ role, content }))
  const toolsUsed = []

  for (let step = 0; step < maxSteps; step++) {
    const { message, finish_reason: finishReason } = await client.messages.create({ model, max_tokens: maxTokens, system, tools, messages: conversation })

    const calls = Array.isArray(message?.tool_calls) ? message.tool_calls : []
    if (finishReason === 'stop' || !calls.length) {
      const reply = typeof message?.content === 'string' ? message.content.trim() : ''
      return { reply: reply || FALLBACK_REPLY, toolsUsed }
    }

    // Keep the assistant turn together with its tool calls, then answer every call.
    conversation.push({ role: 'assistant', content: message.content ?? '', tool_calls: calls })
    for (const call of calls) {
      const name = call.function?.name
      toolsUsed.push(name)
      try {
        conversation.push({ role: 'tool', tool_call_id: call.id, content: serialise(await executeTool(name, parseArguments(call.function?.arguments))) })
      } catch (error) {
        console.error(`chat tool ${name} failed:`, error.message)
        conversation.push({ role: 'tool', tool_call_id: call.id, content: 'The lookup failed. Tell the customer you could not retrieve that information right now.' })
      }
    }
  }
  return { reply: FALLBACK_REPLY, toolsUsed }
}
