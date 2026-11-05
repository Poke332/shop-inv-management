import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { FiMessageCircle, FiSend, FiX } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth.js'
import { detectLang, getReply, GREETING, QUICK_REPLIES } from './chatEngine.js'
import './chat.css'

/**
 * Floating storefront assistant. Mounted once in StorefrontLayout and shown
 * only to guests and buyers (staff+ use the ops workspace).
 */
export default function ChatWidget() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [input, setInput] = useState('')
  const [lang, setLang] = useState('id')
  const [messages, setMessages] = useState(() => [{ role: 'bot', text: GREETING.id }])
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, busy, open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  async function send(raw) {
    const text = raw.trim()
    if (!text || busy) return
    setMessages((m) => [...m, { role: 'user', text }])
    setInput('')
    setBusy(true)
    try {
      const reply = await getReply(text, { user })
      setLang(detectLang(text.toLowerCase()))
      setMessages((m) => [...m, { role: 'bot', ...reply }])
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: 'Terjadi kesalahan saat mengambil data. Coba lagi ya. / Something went wrong, please try again.' }])
    } finally {
      setBusy(false)
    }
  }

  if (user && user.role !== 'buyer') return null

  return (
    <>
      {open && (
        <section className="chat-panel" role="dialog" aria-label="Sunset assistant">
          <header className="chat-header">
            <strong>Sunset assistant</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat"><FiX /></button>
          </header>

          <div className="chat-body" role="log" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                <p>{m.text}</p>
                {m.items?.length > 0 && (
                  <ul className="chat-items">
                    {m.items.map((it, j) => (
                      <li key={j}>
                        <Link to={it.to} onClick={() => setOpen(false)}>
                          <span>{it.title}</span>
                          {it.meta && <small>{it.meta}</small>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {m.links?.length > 0 && (
                  <div className="chat-links">
                    {m.links.map((l) => (
                      <Link key={l.to + l.label} to={l.to} onClick={() => setOpen(false)}>{l.label} →</Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && <div className="chat-msg bot"><p>…</p></div>}
            <div ref={endRef} />
          </div>

          <div className="chat-quick">
            {QUICK_REPLIES[lang].map((q) => (
              <button key={q} type="button" onClick={() => send(q)} disabled={busy}>{q}</button>
            ))}
          </div>

          <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(input) }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pertanyaan… / Ask something…"
              aria-label="Message"
              maxLength={200}
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Send"><FiSend /></button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="chat-fab"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Close chat' : 'Open chat assistant'}
      >
        {open ? <FiX /> : <FiMessageCircle />}
      </button>
    </>
  )
}
