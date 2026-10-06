import { EventEmitter } from 'events'

const globalForSSE = global as unknown as { eventBus: EventEmitter }

export const eventBus = globalForSSE.eventBus || new EventEmitter()
eventBus.setMaxListeners(100)

if (process.env.NODE_ENV !== 'production') globalForSSE.eventBus = eventBus
