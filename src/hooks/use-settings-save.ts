import { useEffect, useRef } from 'react'
import { create } from 'zustand'

/**
 * Coordinates Save buttons in page Headers with form state in child components.
 * Multiple children can register handlers; trigger() calls all of them.
 * Each registration is keyed by a unique ID to prevent conflicts.
 */

interface Registration {
  handler: () => Promise<void>
  disabled?: boolean
  label?: string
}

interface SettingsSaveState {
  saving: boolean
  registrations: Map<string, Registration>

  register: (id: string, opts: Registration) => void
  unregister: (id: string) => void
  trigger: () => Promise<void>
}

export const useSettingsSave = create<SettingsSaveState>()((set, get) => ({
  saving: false,
  registrations: new Map(),

  register: (id, opts) => {
    set((state) => {
      const next = new Map(state.registrations)
      next.set(id, opts)
      return { registrations: next }
    })
  },

  unregister: (id) => {
    set((state) => {
      const next = new Map(state.registrations)
      next.delete(id)
      return { registrations: next }
    })
  },

  trigger: async () => {
    const { registrations } = get()
    if (registrations.size === 0) return
    set({ saving: true })
    try {
      // Call all registered handlers (in practice only one is active at a time
      // because the active tab's handler is the last registered)
      const handlers = Array.from(registrations.values()).map((r) => r.handler())
      await Promise.all(handlers)
    } finally {
      set({ saving: false })
    }
  },
}))

// ─── Convenience hook for child components ───────────────────────────────────

/**
 * Registers a save handler with the settings save store.
 * Automatically handles registration/cleanup lifecycle.
 */
export function useRegisterSave(opts: {
  id: string
  handler: () => Promise<void>
  disabled?: boolean
  label?: string
}) {
  const { id, handler, disabled, label } = opts
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  const { register, unregister } = useSettingsSave()

  useEffect(() => {
    register(id, {
      handler: () => handlerRef.current(),
      disabled,
      label,
    })
    return () => unregister(id)
  }, [id, disabled, label, register, unregister])
}

// ─── Derived selectors ───────────────────────────────────────────────────────

export function useSettingsSaveButton() {
  const { saving, registrations, trigger } = useSettingsSave()
  const hasHandler = registrations.size > 0
  const disabled = Array.from(registrations.values()).some((r) => r.disabled)
  // Use the label from the last registered handler (General tab is typically first)
  const entries = Array.from(registrations.values())
  const label = entries.length > 0 ? (entries[0].label || 'Save Changes') : 'Save Changes'
  return { saving, hasHandler, disabled, label, trigger }
}
