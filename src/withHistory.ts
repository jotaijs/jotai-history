import type { Atom, WritableAtom } from 'jotai'
import { atom } from 'jotai/vanilla'

export const RESET_HISTORY = Symbol('reset history')
export type RESET_HISTORY = typeof RESET_HISTORY

export type ResettableHistory<Value> = Value[] & { reset: () => void }

/**
 * @param targetAtom an atom or derived atom
 * @param limit the maximum number of history states to keep
 * @returns an atom with an array of history states
 */
export function withHistory<Value>(
  targetAtom: Atom<Value>,
  limit: number
): WritableAtom<ResettableHistory<Value>, [RESET_HISTORY], void> {
  const refreshAtom = atom(0)
  refreshAtom.debugPrivate = true
  const historyAtom = {
    read: (get) => (get(refreshAtom), { history: [] }),
    write: (get, set) => {
      get(historyAtom).history.length = 0
      set(refreshAtom, (v) => v + 1)
    },
    onMount: (reset) => reset,
    debugPrivate: true,
    init: 1, // dirty hack to bypass hasInitialValue
  } as WritableAtom<{ history: Value[] }, [], void>
  return atom(
    (get, { setSelf }) => {
      const ref = get(historyAtom)
      return Object.assign(
        (ref.history = [get(targetAtom), ...ref.history].slice(0, limit)),
        { reset: () => setSelf(RESET_HISTORY) }
      )
    },
    (_, set, action: RESET_HISTORY) => {
      if (action === RESET_HISTORY) {
        set(historyAtom)
      }
    }
  )
}
