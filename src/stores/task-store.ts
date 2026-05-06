import { create } from 'zustand'
import { toast } from 'sonner'
import {
  PosterService,
  POSTER_TASK_CREATED_EVENT,
  notifyTaskCompleted,
} from '@/services/api/poster-service'

interface TaskState {
  processingCount: number
  polling: boolean
  start: (customerId: string) => void
  stop: () => void
}

// Module-level singletons so multiple Start calls don't leak listeners/intervals.
let intervalId: ReturnType<typeof setInterval> | null = null
let createdListener: (() => void) | null = null
let currentCustomerId: string | null = null
let lastProcessingCount = 0
// Track whether we recently dispatched a poster task (to detect fast completions)
let expectingCompletion = false

export const useTaskStore = create<TaskState>()((set, get) => ({
  processingCount: 0,
  polling: false,

  start: (customerId: string) => {
    if (get().polling && currentCustomerId === customerId) return

    // Clean any previous polling/listener before re-arming.
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    if (createdListener) {
      window.removeEventListener(POSTER_TASK_CREATED_EVENT, createdListener)
      createdListener = null
    }

    currentCustomerId = customerId

    const poll = async () => {
      try {
        const res = await PosterService.getBackgroundTasks(
          customerId,
          50,
          0,
          { status: 'processing' }
        )
        const next = res.total_tasks
        set({ processingCount: next })

        // Two cases to fire "completed":
        // 1. Normal transition: had processing tasks → now zero.
        // 2. Fast completion: we sent a task (expectingCompletion=true),
        //    polled, and it's already 0 (task finished before we could see it).
        const shouldNotify =
          (lastProcessingCount > 0 && next === 0) ||
          (expectingCompletion && next === 0)

        if (shouldNotify) {
          toast.dismiss('poster-processing-toast')
          notifyTaskCompleted()
          expectingCompletion = false
        }

        lastProcessingCount = next
      } catch {
        // silent — non-critical background poll
      }
    }

    poll()
    intervalId = setInterval(poll, 5000)

    createdListener = () => {
      // Mark that we expect a completion event soon
      expectingCompletion = true
      // Poll quickly: 1.5s, 4s, 8s to catch fast tasks
      setTimeout(poll, 1500)
      setTimeout(poll, 4000)
      setTimeout(poll, 8000)
    }
    window.addEventListener(POSTER_TASK_CREATED_EVENT, createdListener)

    set({ polling: true })
  },

  stop: () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    if (createdListener) {
      window.removeEventListener(POSTER_TASK_CREATED_EVENT, createdListener)
      createdListener = null
    }
    currentCustomerId = null
    lastProcessingCount = 0
    expectingCompletion = false
    set({ polling: false, processingCount: 0 })
  },
}))
