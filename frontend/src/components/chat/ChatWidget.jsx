import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { FiMessageCircle, FiSend, FiX } from 'react-icons/fi'

import { mockApi } from '../../data'
import '../../styles/chat.css'

const SUGGESTIONS = [
  'What is in stock under Rp 500.000?',
  'Recommend a gift for a gamer',
  'How do I place an order?',
]

/**
 * Turn the model's reply into React nodes. Only two inline forms are supported —
 * **bold** and [label](/internal/path) — and everything else is plain text, so
 * nothing from the model is ever injected as HTML. Links must be same-site
 * paths (a single leading "/"), which also rules out javascript: and external URLs.
 */
function renderInline(text, onNavigate) {
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\(\/(?!\/)[^)\s]*\))/g
  return text.split(pattern).map((part, index) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/)
    if (bold) return <strong key={index}>{bold[1]}</strong>
    const link = part.match(/^\[([^\]]+)\]\((\/[^)\s]*)\)$/)
    if (link) return <Link key={index} to={link[2]} onClick={onNavigate}>{link[1]}</Link>
    return part
  })
}

function MessageText({ text, onNavigate }) {
  const blocks = []
  for (const line of text.split('\n')) {
    const item = line.match(/^\s*[-*]\s+(.*)$/)
    if (item) {
      const last = blocks.at(-1)
      if (last?.type === 'list') last.items.push(item[1])
      else blocks.push({ type: 'list', items: [item[1]] })
    } else if (line.trim()) {
      blocks.push({ type: 'p', text: line })
    }
  }
  return blocks.map((block, index) => block.type === 'list'
    ? <ul key={index}>{block.items.map((item, i) => <li key={i}>{renderInline(item, onNavigate)}</li>)}</ul>
    : <p key={index}>{renderInline(block.text, onNavigate)}</p>)
}

function friendlyError(error) {
  if (error.status === 0) return 'I cannot reach the server right now. Check your connection and try again.'
  if (error.status === 429) return 'You are sending messages too quickly. Please wait a moment and try again.'
  if (error.status === 503) return error.message || 'The assistant is unavailable right now.'
  return 'Something went wrong. Please try again.'
}

let nextId = 0
const newMessage = (fields) => ({ id: `chat-${++nextId}`, ...fields })

/**
 * Floating chat assistant: stock questions, product recommendations and
 * app help. Every answer comes from POST /api/chat (an LLM with tools that
 * read the live database); this component only holds the conversation and
 * renders it.
 * @returns {object} the launcher button and, when open, the chat panel.
 */
export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const launcherRef = useRef(null)
  const endRef = useRef(null)
  const controllerRef = useRef(null)

  useEffect(() => () => controllerRef.current?.abort(), [])
  useEffect(() => { if (open) inputRef.current?.focus() }, [open])
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [messages, loading, open])

  const close = () => { setOpen(false); launcherRef.current?.focus() }
  const closeOnSmallScreens = () => { if (window.innerWidth < 640) setOpen(false) }

  // `base` is the conversation to continue from (a retry resends from before the failed turn).
  const send = async (raw, base = messages) => {
    const text = raw.trim()
    if (!text || loading) return
    const history = [...base.filter((m) => !m.error), newMessage({ role: 'user', content: text })]
    setMessages(history)
    setInput('')
    setLoading(true)
    controllerRef.current = new AbortController()
    try {
      const { reply } = await mockApi.sendChat(history.map(({ role, content }) => ({ role, content })), controllerRef.current.signal)
      setMessages([...history, newMessage({ role: 'assistant', content: reply })])
    } catch (error) {
      if (error.name === 'AbortError') return
      setMessages([...history, newMessage({ role: 'assistant', content: '', error: friendlyError(error) })])
    } finally {
      setLoading(false)
    }
  }

  const retry = () => {
    const index = messages.findLastIndex((m) => m.role === 'user')
    if (index >= 0) send(messages[index].content, messages.slice(0, index))
  }

  return (
    <>
      {!open && (
        <button ref={launcherRef} type="button" className="chat-launcher" onClick={() => setOpen(true)} aria-label="Open chat assistant">
          <FiMessageCircle aria-hidden="true" /><span>Ask us</span>
        </button>
      )}
      {open && (
        <section className="chat-panel" role="dialog" aria-label="Sunset assistant" onKeyDown={(event) => { if (event.key === 'Escape') close() }}>
          <header className="chat-header">
            <div>
              <strong>Sunset assistant</strong>
              <small>Stock, recommendations &amp; app help</small>
            </div>
            <button type="button" className="chat-icon-button" onClick={close} aria-label="Close chat"><FiX aria-hidden="true" /></button>
          </header>

          <div className="chat-log" role="log" aria-live="polite" aria-label="Conversation">
            {messages.length === 0 && (
              <div className="chat-empty">
                <p>Hi! Ask me whether something is in stock, what to buy for your budget, or how to use the app.</p>
                <div className="chat-suggestions">
                  {SUGGESTIONS.map((text) => (
                    <button key={text} type="button" onClick={() => send(text)}>{text}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message) => (
              message.error ? (
                <div key={message.id} className="chat-bubble chat-error" role="alert">
                  <p>{message.error}</p>
                  <button type="button" onClick={retry} disabled={loading}>Try again</button>
                </div>
              ) : (
                <div key={message.id} className={'chat-bubble ' + (message.role === 'user' ? 'chat-user' : 'chat-bot')}>
                  {message.role === 'user' ? <p>{message.content}</p> : <MessageText text={message.content} onNavigate={closeOnSmallScreens} />}
                </div>
              )
            ))}
            {loading && (
              <div className="chat-bubble chat-bot chat-typing" aria-label="The assistant is typing"><span /><span /><span /></div>
            )}
            <div ref={endRef} />
          </div>

          <form className="chat-form" onSubmit={(event) => { event.preventDefault(); send(input) }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={1000}
              placeholder="Type your question…"
              aria-label="Message"
              autoComplete="off"
              disabled={loading}
            />
            <button type="submit" aria-label="Send message" disabled={loading || !input.trim()}><FiSend aria-hidden="true" /></button>
          </form>
        </section>
      )}
    </>
  )
}
