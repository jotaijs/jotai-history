import { atom } from 'jotai/vanilla'
import type { Atom } from 'jotai/vanilla'

/**
 * @param targetAtom an atom or derived atom
 * @param limit the maximum number of history states to keep
 * @returns an atom with an array of history states
 */
export function atomWithHistory<T>(targetAtom: Atom<T>, limit: number) {
  const refAtom = atom(
    () => ({
      history: [] as T[],
    }),
    (get) => () => {
      get(refAtom).history.length = 0
    }
  )
  refAtom.onMount = (mount) => mount()
  refAtom.debugPrivate = true
  return atom((get) => {
    const ref = get(refAtom)
    const value = get(targetAtom)
    ref.history = [value, ...ref.history].slice(0, limit)
    return ref.history
  })
}
