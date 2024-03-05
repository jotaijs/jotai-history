import { atom, createStore } from 'jotai/vanilla'
import type { PrimitiveAtom } from 'jotai/vanilla'
import { atomWithUndo } from '../src/atomWithUndo'

describe('atomWithUndo', () => {
  let store: ReturnType<typeof createStore>
  let baseAtom: PrimitiveAtom<number>
  let undoableAtom: ReturnType<typeof atomWithUndo<number>>
  let unsub: () => void

  beforeEach(() => {
    store = createStore()
    baseAtom = atom(0)
    undoableAtom = atomWithUndo(baseAtom, 3) // Limit history to 3 entries
    unsub = store.sub(undoableAtom, () => {}) // Subscribe to trigger onMount
  })

  it('supports undo operation', () => {
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    store.get(undoableAtom).undo()
    expect(store.get(baseAtom)).toBe(1) // Should undo to the previous value
  })

  it('supports redo operation', () => {
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    store.get(undoableAtom).undo()
    store.get(undoableAtom).redo()
    expect(store.get(baseAtom)).toBe(2) // Should redo to the value before undo
  })

  it('respects history limit', () => {
    // Limit is 3, so max undos is 2, and max redos is 2
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    store.set(baseAtom, 3)
    store.set(baseAtom, 4)

    expect(store.get(undoableAtom).canUndo).toBe(true)
    expect(store.get(undoableAtom).canRedo).toBe(false)
    store.get(undoableAtom).undo()
    expect(store.get(undoableAtom).canUndo).toBe(true)
    store.get(undoableAtom).undo()

    expect(store.get(undoableAtom).canUndo).toBe(false) // Cannot undo beyond limit
    expect(store.get(undoableAtom).canRedo).toBe(true)
    store.get(undoableAtom).redo()
    expect(store.get(undoableAtom).canUndo).toBe(true)
    store.get(undoableAtom).redo()

    expect(store.get(undoableAtom).canUndo).toBe(true)
    expect(store.get(undoableAtom).canRedo).toBe(false) // Cannot redo beyond limit
  })

  it('checks undo and redo availability', () => {
    expect(store.get(undoableAtom).canUndo).toBe(false) // No undo initially
    expect(store.get(undoableAtom).canRedo).toBe(false) // No redo initially
    store.set(baseAtom, 1)
    expect(store.get(undoableAtom).canUndo).toBe(true) // Undo becomes available
    store.get(undoableAtom).undo()
    expect(store.get(undoableAtom).canRedo).toBe(true) // Redo becomes available after undo
  })

  it('cleans up history on unmount', async () => {
    store.set(baseAtom, 1)
    expect(store.get(undoableAtom).canUndo).toBe(true) // Can undo before unmount
    console.log('unsub')
    unsub() // Unsubscribe to unmount
    console.log('sub')
    unsub = store.sub(undoableAtom, () => {}) // Subscribe to mount
    await delay(100)
    expect(store.get(undoableAtom).canUndo).toBe(false) // Cannot undo after unmount
  })
})

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
