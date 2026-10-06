import { eventBus } from '@/lib/sse'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const listener = (data: string) => {
        controller.enqueue(`data: ${data}\n\n`)
      }

      eventBus.on('update', listener)
      controller.enqueue(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`)

      req.signal.addEventListener('abort', () => {
        eventBus.off('update', listener)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  })
}
