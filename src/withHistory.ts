import type { Atom, WritableAtom } from 'jotai'
import { atom } from 'jotai/vanilla'

export const RESET_HISTORY = Symbol('reset history')
export type RESET_HISTORY = typeof RESET_HISTORY

export type ResettableHistory<T> = T[] & { reset: () => void }

/**
 * @param targetAtom an atom or derived atom
 * @param limit the maximum number of history states to keep
 * @returns an atom with an array of history states
 */
export function withHistory<T>(
  targetAtom: Atom<T>,
  limit: number
): WritableAtom<ResettableHistory<T>, [RESET_HISTORY], void> {
  const refreshAtom = atom(0)
  refreshAtom.debugPrivate = true
  const refAtom = {
    read: (get) => (get(refreshAtom), { history: [] }),
    write: (get, set) => {
      set(refreshAtom, (v) => v + 1)
      get(refAtom).history.length = 0
    },
    onMount: (reset) => () => reset(),
    debugPrivate: true,
    init: 1, // dirty hack to bypass hasInitialValue
  } as WritableAtom<{ history: T[] }, [], void>
  return atom(
    (get, { setSelf }) => {
      const ref = get(refAtom)
      return Object.assign(
        (ref.history = [get(targetAtom), ...ref.history].slice(0, limit)),
        { reset: () => setSelf(RESET_HISTORY) }
      )
    },
    (_, set, action: RESET_HISTORY) => {
      if (action === RESET_HISTORY) {
        set(refAtom)
      }
    }
  )
}
