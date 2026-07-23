import { useCallback, useState } from 'react'
import { API_GATEWAY_URL } from '../config'
import { parseSseStream } from '../lib/sse'
import type { ChatMessage } from '../types'

export function useAgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  const sendMessage = useCallback(async (text: string) => {
    setMessages((prev) => [...prev, { role: 'user', text }, { role: 'assistant', text: '' }])
    setIsStreaming(true)

    try {
      const response = await fetch(`${API_GATEWAY_URL}/v1/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      for await (const sseEvent of parseSseStream(response)) {
        if (sseEvent.event === 'done') break
        const chunk = (JSON.parse(sseEvent.data) as { text: string }).text
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', text: next[next.length - 1].text + chunk }
          return next
        })
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', text: 'No se pudo contactar al asistente de IA.' }
        return next
      })
    } finally {
      setIsStreaming(false)
    }
  }, [])

  return { messages, isStreaming, sendMessage }
}
