import { atom } from 'jotai/vanilla'
import type { PrimitiveAtom } from 'jotai/vanilla'
import { atomWithHistory } from './atomWithHistory'

type Undoable = {
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

/**
 * @param targetAtom a primitive atom or equivalent
 * @param limit the maximum number of history states to keep
 * @returns an atom with undo/redo functionality
 */
export function atomWithUndo<T>(targetAtom: PrimitiveAtom<T>, limit: number) {
  const historyAtom = atomWithHistory(targetAtom, limit)
  const UNDO = Symbol('undo')
  const REDO = Symbol('redo')
  type DoAction = typeof UNDO | typeof REDO
  const refAtom = atom(() => ({
    index: 0,
    stack: [] as T[][],
    action: null as DoAction | null,
  }))
  refAtom.debugPrivate = true
  const updateRefAtom = atom(
    (get) => {
      const history = get(historyAtom)
      const ref = get(refAtom)
      if (ref.action) {
        // recalculation caused by undo/redo
        ref.action = null
      } else {
        // Remove future states if any
        ref.stack = ref.stack.slice(0, ref.index + 1)
        // Push the current state to the history
        ref.stack.push(history.slice())
        // Limit the history
        ref.stack = ref.stack.slice(-limit)
        // Move the current index to the end
        ref.index = ref.stack.length - 1
      }
      return null
    },
    (get) => {
      get(refAtom).stack = [[get(targetAtom)]]
      return () => {
        const ref = get(refAtom)
        ref.index = 0
        ref.stack.length = 0
      }
    }
  )
  updateRefAtom.onMount = (mount) => mount()
  updateRefAtom.debugPrivate = true
  const baseAtom = atom<Undoable, [DoAction], void>(
    (get, { setSelf }) => {
      get(updateRefAtom)

      return {
        undo: () => setSelf(UNDO),
        redo: () => setSelf(REDO),
        get canUndo() {
          return get(refAtom).index > 0
        },
        get canRedo() {
          return get(refAtom).index < get(refAtom).stack.length - 1
        },
      }
    },
    (get, set, update) => {
      const ref = get(refAtom)
      const setCurrentState = () => {
        const currentSlice = ref.stack[ref.index]
        if (currentSlice?.[0] === undefined) return
        set(targetAtom, currentSlice[0])
      }
      if (update === UNDO) {
        if (get(baseAtom).canUndo) {
          ref.index--
          ref.action = UNDO
          setCurrentState()
        }
        return
      }
      if (update === REDO) {
        if (get(baseAtom).canRedo) {
          ref.index++
          ref.action = REDO
          setCurrentState()
        }
        return
      }
    }
  )
  baseAtom.debugPrivate = true
  return atom((get) => get(baseAtom))
}
