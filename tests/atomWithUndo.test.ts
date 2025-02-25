import { atom, createStore } from 'jotai/vanilla'
import type { PrimitiveAtom } from 'jotai/vanilla'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { withUndo } from 'jotai-history'

describe('withUndo', () => {
  let store: ReturnType<typeof createStore>
  let baseAtom: PrimitiveAtom<number>
  let undoableAtom: ReturnType<typeof withUndo<number>>
  let unsub: () => void
  const undoable = {
    undo() {
      return store.get(undoableAtom).undo()
    },
    redo() {
      return store.get(undoableAtom).redo()
    },
    get canUndo() {
      return store.get(undoableAtom).canUndo
    },
    get canRedo() {
      return store.get(undoableAtom).canRedo
    },
  }

  beforeEach(() => {
    store = createStore()
    baseAtom = atom(0)
    undoableAtom = withUndo(baseAtom, 3) // Limit history to 3 entries
    unsub = store.sub(undoableAtom, () => {}) // Subscribe to trigger onMount
  })

  it('supports undo operation', () => {
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    undoable.undo()
    expect(store.get(baseAtom)).toBe(1) // Should undo to the previous value
  })

  it('supports redo operation', () => {
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    undoable.undo()
    undoable.redo()
    expect(store.get(baseAtom)).toBe(2) // Should redo to the value before undo
  })

  it('respects history limit', () => {
    // Limit is 3, so max undos is 2, and max redos is 2
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    store.set(baseAtom, 3)
    store.set(baseAtom, 4)

    expect(undoable.canUndo).toBe(true)
    expect(undoable.canRedo).toBe(false)
    undoable.undo()
    expect(undoable.canUndo).toBe(true)
    undoable.undo()

    expect(undoable.canUndo).toBe(false) // Cannot undo beyond limit
    expect(undoable.canRedo).toBe(true)
    undoable.redo()
    expect(undoable.canUndo).toBe(true)
    undoable.redo()

    expect(undoable.canUndo).toBe(true)
    expect(undoable.canRedo).toBe(false) // Cannot redo beyond limit
  })

  it('checks undo and redo availability', () => {
    expect(undoable.canUndo).toBe(false) // No undo initially
    expect(undoable.canRedo).toBe(false) // No redo initially
    store.set(baseAtom, 1)
    expect(undoable.canUndo).toBe(true) // Undo becomes available
    undoable.undo()
    expect(undoable.canRedo).toBe(true) // Redo becomes available after undo
  })

  it('cleans up history on unmount', () => {
    store.set(baseAtom, 1)
    expect(undoable.canUndo).toBe(true) // Can undo before unmount
    unsub() // Unsubscribe to unmount
    unsub = store.sub(undoableAtom, () => {}) // Subscribe to mount
    expect(undoable.canUndo).toBe(false) // Cannot undo after unmount
  })

  it('rerenders when only undo/redo is changes', () => {
    const spy = vi.fn()
    store.sub(undoableAtom, spy)
    expect(undoable).toMatchObject({ canUndo: false, canRedo: false }) // start
    store.set(baseAtom, 1)
    expect(undoable).toMatchObject({ canUndo: true, canRedo: false }) // canUndo changed
    expect(spy).toBeCalledTimes(1)
    store.set(baseAtom, 2)
    expect(undoable).toMatchObject({ canUndo: true, canRedo: false }) // no-change
    expect(spy).toBeCalledTimes(1)
    undoable.undo()
    expect(undoable).toMatchObject({ canUndo: true, canRedo: true }) // canRedo changed
    expect(spy).toBeCalledTimes(2)
    undoable.undo()
    expect(undoable).toMatchObject({ canUndo: false, canRedo: true }) // canUndo changed
    expect(spy).toBeCalledTimes(3)
    undoable.redo()
    expect(undoable).toMatchObject({ canUndo: true, canRedo: true }) // canUndo changed
    expect(spy).toBeCalledTimes(4)
    undoable.redo()
    expect(undoable).toMatchObject({ canUndo: true, canRedo: false }) // no-change
    expect(spy).toBeCalledTimes(5)
  })
})
