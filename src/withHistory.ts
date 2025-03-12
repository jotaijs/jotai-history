import type { Atom, WritableAtom } from 'jotai'
import { atom } from 'jotai/vanilla'
import { RESET } from './actions'

export type History<Value> = Value[]

/**
 * @param targetAtom an atom or derived atom
 * @param limit the maximum number of history states to keep
 * @returns an atom with an array of history states
 */
export function withHistory<Value>(
  targetAtom: Atom<Value>,
  limit: number
): WritableAtom<History<Value>, [RESET], void> {
  const refreshAtom = atom(0)
  refreshAtom.debugPrivate = true
  const historyAtom = atom<{ history: History<Value> }>(() => ({ history: [] }))
  historyAtom.debugPrivate = true
  const refreshableHistoryAtom = atom(
    (get) => {
      get(refreshAtom)
      const ref = get(historyAtom)
      return (ref.history = [get(targetAtom), ...ref.history].slice(0, limit))
    },
    (get, set, action: RESET) => {
      if (action === RESET) {
        get(historyAtom).history.length = 0
        set(refreshAtom, (v) => v + 1)
      }
    }
  )
  refreshableHistoryAtom.debugPrivate = true
  refreshableHistoryAtom.onMount = (setAtom) => () => setAtom(RESET)
  return refreshableHistoryAtom
}
