import { create } from 'zustand'

/**
 * Coordinates a Save button in the page Header with form state
 * in child components. Child components register their save handler;
 * the Header button triggers it.
 */

interface SettingsSaveState {
  saving: boolean
  disabled: boolean
  label: string
  handler: (() => Promise<void>) | null

  /** Called by child components to register their save logic */
  register: (opts: { handler: () => Promise<void>; disabled?: boolean; label?: string }) => void
  /** Called by child components on unmount */
  unregister: () => void
  /** Called by the Header Save button */
  trigger: () => Promise<void>
  /** Update disabled state */
  setDisabled: (disabled: boolean) => void
}

export const useSettingsSave = create<SettingsSaveState>()((set, get) => ({
  saving: false,
  disabled: false,
  label: 'Save Changes',
  handler: null,

  register: ({ handler, disabled = false, label = 'Save Changes' }) => {
    set({ handler, disabled, label })
  },

  unregister: () => {
    set({ handler: null, saving: false, disabled: false, label: 'Save Changes' })
  },

  trigger: async () => {
    const { handler } = get()
    if (!handler) return
    set({ saving: true })
    try {
      await handler()
    } finally {
      set({ saving: false })
    }
  },

  setDisabled: (disabled) => set({ disabled }),
}))
