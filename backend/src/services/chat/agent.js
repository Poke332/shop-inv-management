/**
 * The tool-use loop: send the conversation to the model, run any tools it asks
 * for, feed the results back, and repeat until it answers in plain text.
 *
 * It is deliberately independent of the database and of the Express layer: the
 * client and the tool executor are injected, so the loop can be unit-tested
 * with fakes and the route stays a thin HTTP wrapper.
 */

const MAX_TOOL_RESULT_CHARS = 12000

const FALLBACK_REPLY = 'Sorry, I could not finish that request. Please try rephrasing your question.'

function serialise(result) {
  const text = JSON.stringify(result)
  return text.length > MAX_TOOL_RESULT_CHARS ? text.slice(0, MAX_TOOL_RESULT_CHARS) + '…[truncated]' : text
}

/**
 * @param {object} options
 * @param {{messages: {create: Function}}} options.client  Anthropic SDK client (or a compatible fake).
 * @param {string} options.model  model id.
 * @param {string} options.system  system prompt.
 * @param {object[]} options.tools  tool definitions.
 * @param {(name: string, input: object) => Promise<object>} options.executeTool  runs one tool call.
 * @param {{role: 'user'|'assistant', content: string}[]} options.messages  the conversation so far (ends with a user turn).
 * @param {number} [options.maxSteps]  cap on model round-trips, so a misbehaving loop cannot run forever.
 * @param {number} [options.maxTokens]  output cap per model call.
 * @returns {Promise<{reply: string, toolsUsed: string[]}>}
 */
export async function runChat({ client, model, system, tools, executeTool, messages, maxSteps = 6, maxTokens = 1024 }) {
  const conversation = messages.map(({ role, content }) => ({ role, content }))
  const toolsUsed = []

  for (let step = 0; step < maxSteps; step++) {
    const response = await client.messages.create({ model, max_tokens: maxTokens, system, tools, messages: conversation })

    if (response.stop_reason !== 'tool_use') {
      const reply = response.content.filter(block => block.type === 'text').map(block => block.text).join('\n').trim()
      return { reply: reply || FALLBACK_REPLY, toolsUsed }
    }

    // Keep the assistant turn exactly as returned (tool_use blocks included), then answer every tool call.
    conversation.push({ role: 'assistant', content: response.content })
    const results = []
    for (const block of response.content.filter(item => item.type === 'tool_use')) {
      toolsUsed.push(block.name)
      try {
        results.push({ type: 'tool_result', tool_use_id: block.id, content: serialise(await executeTool(block.name, block.input)) })
      } catch (error) {
        console.error(`chat tool ${block.name} failed:`, error.message)
        results.push({ type: 'tool_result', tool_use_id: block.id, is_error: true, content: 'The lookup failed. Tell the customer you could not retrieve that information right now.' })
      }
    }
    conversation.push({ role: 'user', content: results })
  }
  return { reply: FALLBACK_REPLY, toolsUsed }
}
