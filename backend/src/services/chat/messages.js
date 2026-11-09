import { fail } from '../validation.js'

const MAX_MESSAGES = 20 // the model only sees the most recent turns
const MAX_CONTENT = 4000

/**
 * Validate and normalise the conversation sent by a client.
 *
 * Accepts [{role: 'user'|'assistant', content: string}], merges consecutive
 * turns of the same role (the API requires alternation), drops leading
 * assistant turns, keeps the last MAX_MESSAGES, and requires the final turn to
 * be from the user.
 * @param {unknown} input  the raw `messages` value from the request body.
 * @returns {{role: string, content: string}[]} clean messages, never empty.
 * @throws {Error} 400 when the payload is malformed.
 */
export function normalizeMessages(input) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 200) fail(400, 'messages must be a non-empty array.')
  const merged = []
  for (const item of input) {
    if (!item || !['user', 'assistant'].includes(item.role)) fail(400, 'Each message needs a role of "user" or "assistant".')
    if (typeof item.content !== 'string' || item.content.length > MAX_CONTENT) fail(400, `Message content must be text of at most ${MAX_CONTENT} characters.`)
    const content = item.content.trim()
    if (!content) continue
    const last = merged.at(-1)
    if (last && last.role === item.role) last.content += '\n' + content
    else merged.push({ role: item.role, content })
  }
  while (merged.length && merged[0].role !== 'user') merged.shift()
  const recent = merged.slice(-MAX_MESSAGES)
  while (recent.length && recent[0].role !== 'user') recent.shift()
  if (!recent.length || recent.at(-1).role !== 'user') fail(400, 'The last message must be a non-empty user message.')
  return recent
}
