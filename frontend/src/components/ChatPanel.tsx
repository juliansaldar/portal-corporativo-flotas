import { useState } from 'react'
import { useAgentChat } from '../hooks/useAgentChat'

export function ChatPanel() {
  const { messages, isStreaming, sendMessage } = useAgentChat()
  const [input, setInput] = useState('')

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    void sendMessage(text)
  }

  return (
    <div className="panel chat-panel">
      <h2>Asistente de flota</h2>
      <div className="chat-history">
        {messages.length === 0 && (
          <p className="muted">
            Pregunta, por ejemplo: "¿Qué vehículos llevan detenidos más de 20 minutos en zonas críticas?"
          </p>
        )}
        {messages.map((message, index) => (
          <div key={index} className={`chat-message chat-message--${message.role}`}>
            {message.text || (isStreaming && index === messages.length - 1 ? '…' : '')}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="chat-form">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Escribe tu pregunta"
          disabled={isStreaming}
        />
        <button type="submit" disabled={isStreaming || !input.trim()}>
          Enviar
        </button>
      </form>
    </div>
  )
}
