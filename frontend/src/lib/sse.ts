export interface SseEvent {
  event: string
  data: string
}

/**
 * Parser SSE manual sobre un ReadableStream de fetch. EventSource nativo no
 * soporta POST con body, asi que para el chat leemos el stream a mano en vez
 * de sumar una libreria como @microsoft/fetch-event-source para un solo caso.
 */
export async function* parseSseStream(response: Response): AsyncGenerator<SseEvent> {
  const reader = response.body?.getReader()
  if (!reader) return

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let separatorIndex: number
    while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, separatorIndex)
      buffer = buffer.slice(separatorIndex + 2)
      yield parseEvent(rawEvent)
    }
  }
}

function parseEvent(raw: string): SseEvent {
  let event = 'message'
  const dataLines: string[] = []

  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trim())
    }
  }

  return { event, data: dataLines.join('\n') }
}
