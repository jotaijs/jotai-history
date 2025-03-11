import { atom, createStore } from 'jotai/vanilla'
import type { PrimitiveAtom } from 'jotai/vanilla'
import { beforeEach, describe, expect, it } from 'vitest'
import { REDO, RESET, UNDO } from '../src/actions'
import { withHistoryAndUndo } from '../src/withHistoryAndUndo'

describe('withHistoryAndUndo', () => {
  let store: ReturnType<typeof createStore>
  let baseAtom: PrimitiveAtom<number>
  let historyUndoableAtom: ReturnType<
    typeof withHistoryAndUndo<PrimitiveAtom<number>>
  >

  beforeEach(() => {
    store = createStore()
    baseAtom = atom(0)
    historyUndoableAtom = withHistoryAndUndo(baseAtom, 3) // Limit history to 3 entries
    store.sub(historyUndoableAtom, () => {})
  })

  it('tracks history of changes', () => {
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    expect([...store.get(historyUndoableAtom)]).toEqual([2, 1, 0]) // History should track changes
  })

  it('enforces history limit', () => {
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    store.set(baseAtom, 3)
    store.set(baseAtom, 4)
    expect(store.get(historyUndoableAtom).length).toBe(3) // Length should not exceed limit
    expect([...store.get(historyUndoableAtom)]).toEqual([4, 3, 2]) // Only the most recent 3 states are kept
  })

  it('resets history', () => {
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    store.get(historyUndoableAtom).reset()
    expect([...store.get(historyUndoableAtom)]).toEqual([2]) // History should be reset
  })

  it('supports undo operation', () => {
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    store.set(historyUndoableAtom, UNDO)
    expect(store.get(baseAtom)).toBe(1) // Should undo to the previous value
  })

  it('supports redo operation', () => {
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    store.set(historyUndoableAtom, UNDO)
    store.set(historyUndoableAtom, REDO)
    expect(store.get(baseAtom)).toBe(2) // Should redo to the value before undo
  })

  it('checks undo and redo availability', () => {
    expect(store.get(historyUndoableAtom).canUndo).toBe(false) // No undo initially
    expect(store.get(historyUndoableAtom).canRedo).toBe(false) // No redo initially
    store.set(baseAtom, 1)
    expect(store.get(historyUndoableAtom).canUndo).toBe(true) // Undo becomes available
    store.set(historyUndoableAtom, UNDO)
    expect(store.get(historyUndoableAtom).canRedo).toBe(true) // Redo becomes available after undo
  })

  it('resets history with RESET', () => {
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    store.set(historyUndoableAtom, RESET)
    expect([...store.get(historyUndoableAtom)]).toEqual([2]) // History should be reset
  })

  it('supports undo with UNDO', () => {
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    store.set(historyUndoableAtom, UNDO)
    expect(store.get(baseAtom)).toBe(1) // Should undo to the previous value
  })

  it('supports redo with REDO', () => {
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    store.set(historyUndoableAtom, UNDO)
    store.set(historyUndoableAtom, REDO)
    expect(store.get(baseAtom)).toBe(2) // Should redo to the value before undo
  })

  it('resets undo stack with RESET', () => {
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    store.set(historyUndoableAtom, UNDO)
    store.set(historyUndoableAtom, RESET)
    expect(store.get(historyUndoableAtom).canUndo).toBe(false)
    expect(store.get(historyUndoableAtom).canRedo).toBe(false)
  })

  it('resets undo stack with history.reset()', () => {
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    store.set(historyUndoableAtom, UNDO)
    store.get(historyUndoableAtom).reset()
    expect(store.get(historyUndoableAtom).canUndo).toBe(false)
    expect(store.get(historyUndoableAtom).canRedo).toBe(false)
  })
})
