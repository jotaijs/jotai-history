import type { WritableAtom } from 'jotai/vanilla'
import { atom } from 'jotai/vanilla'
import type { withHistory } from './withHistory'

export const UNDO = Symbol('undo')
export type UNDO = typeof UNDO

export const REDO = Symbol('redo')
export type REDO = typeof REDO

export const RESET = Symbol('reset')
export type RESET = typeof RESET

export type Undoable = {
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
export function withUndo<Value, Args extends unknown[], Result>(
  historyAtom: ReturnType<typeof withHistory>,
  targetAtom: WritableAtom<Value, Args, Result>,
  limit: number,
  getArgs?: (value: Value) => Args
): WritableAtom<Undoable, [UNDO | REDO | RESET], void> {
  const createRef = () => ({
    index: 0,
    stack: [] as Value[],
    action: null as UNDO | REDO | RESET | null,
  })
  const refreshAtom = atom(0)
  const refAtom = atom(createRef, (get, set, action: RESET) => {
    if (action === RESET) {
      void Object.assign(get(refAtom), createRef())
      set(refreshAtom, (v) => v + 1)
    }
  })
  refAtom.onMount = (setAtom) => () => setAtom(RESET)
  refAtom.debugPrivate = true
  const updateRefAtom = atom(
    (get) => {
      const history = get(historyAtom)
      const ref = get(refAtom)
      get(refreshAtom)
      if (ref.action) {
        // recalculation caused by undo/redo
        ref.action = null
      } else {
        // Remove future states if any
        ref.stack = ref.stack.slice(0, ref.index + 1)
        // Push the current state to the history
        ref.stack.push(history[0] as Value)
        // Limit the history
        ref.stack = ref.stack.slice(-limit)
        // Move the current index to the end
        ref.index = ref.stack.length - 1
      }
      return { ...ref }
    },
    (get, set) => {
      const ref = get(refAtom)
      ref.stack = [get(targetAtom)]
      return () => set(refAtom, RESET)
    }
  )
  updateRefAtom.onMount = (mount) => mount()
  updateRefAtom.debugPrivate = true
  const canUndoAtom = atom((get) => {
    return get(updateRefAtom).index > 0
  })
  const canRedoAtom = atom((get) => {
    const ref = get(updateRefAtom)
    return ref.index < ref.stack.length - 1
  })
  const baseAtom = atom<Undoable, [UNDO | REDO | RESET], void>(
    (get, { setSelf }) => ({
      undo: () => setSelf(UNDO),
      redo: () => setSelf(REDO),
      canUndo: get(canUndoAtom),
      canRedo: get(canRedoAtom),
    }),
    (get, set, action) => {
      const ref = get(refAtom)
      const setCurrentState = (index: number) => {
        if (index in ref.stack) {
          const value = ref.stack[index]!
          const args = typeof getArgs === 'function' ? getArgs(value) : [value]
          set(targetAtom, ...(args as Args))
        }
      }
      if (action === UNDO) {
        if (get(baseAtom).canUndo) {
          ref.action = UNDO
          setCurrentState(--ref.index)
        }
      } else if (action === REDO) {
        if (get(baseAtom).canRedo) {
          ref.action = REDO
          setCurrentState(++ref.index)
        }
      } else if (action === RESET) {
        ref.action = RESET
        set(refAtom, action)
      }
    }
  )
  return baseAtom
}
