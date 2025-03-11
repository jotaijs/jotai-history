import { atom, createStore } from 'jotai/vanilla'
import type { PrimitiveAtom } from 'jotai/vanilla'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { REDO, RESET, UNDO } from '../src/actions'
import { withHistory } from '../src/withHistory'
import { withUndo } from '../src/withUndo'

describe('withUndo', () => {
  let store: ReturnType<typeof createStore>
  let baseAtom: PrimitiveAtom<number>
  let historyAtom: ReturnType<typeof withHistory<number>>
  let undoableAtom: ReturnType<typeof withUndo<number, [number], void>>
  let unsub: () => void

  beforeEach(() => {
    store = createStore()
    baseAtom = atom(0)
    historyAtom = withHistory(baseAtom, 3)
    undoableAtom = withUndo(historyAtom, baseAtom, 3) // Limit history to 3 entries
    unsub = store.sub(undoableAtom, () => {}) // Subscribe to trigger onMount
  })

  it('supports undo operation', () => {
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    store.set(undoableAtom, UNDO)
    expect(store.get(baseAtom)).toBe(1) // Should undo to the previous value
  })

  it('supports redo operation', () => {
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    store.set(undoableAtom, UNDO)
    store.set(undoableAtom, REDO)
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
    store.set(undoableAtom, UNDO)
    expect(store.get(undoableAtom).canUndo).toBe(true)
    store.set(undoableAtom, UNDO)

    expect(store.get(undoableAtom).canUndo).toBe(false) // Cannot undo beyond limit
    expect(store.get(undoableAtom).canRedo).toBe(true)
    store.set(undoableAtom, REDO)
    expect(store.get(undoableAtom).canUndo).toBe(true)
    store.set(undoableAtom, REDO)

    expect(store.get(undoableAtom).canUndo).toBe(true)
    expect(store.get(undoableAtom).canRedo).toBe(false) // Cannot redo beyond limit
  })

  it('checks undo and redo availability', () => {
    expect(store.get(undoableAtom).canUndo).toBe(false) // No undo initially
    expect(store.get(undoableAtom).canRedo).toBe(false) // No redo initially
    store.set(baseAtom, 1)
    expect(store.get(undoableAtom).canUndo).toBe(true) // Undo becomes available
    store.set(undoableAtom, UNDO)
    expect(store.get(undoableAtom).canRedo).toBe(true) // Redo becomes available after undo
  })

  it('cleans up history on unmount', () => {
    store.set(baseAtom, 1)
    expect(store.get(undoableAtom).canUndo).toBe(true) // Can undo before unmount
    unsub() // Unsubscribe to unmount
    unsub = store.sub(undoableAtom, () => {}) // Subscribe to mount
    expect(store.get(undoableAtom).canUndo).toBe(false) // Cannot undo after unmount
  })

  it('rerenders when only undo/redo is changes', () => {
    const spy = vi.fn()
    store.sub(undoableAtom, spy)
    expect(store.get(undoableAtom)).toMatchObject({
      canUndo: false,
      canRedo: false,
    }) // start
    store.set(baseAtom, 1)
    expect(store.get(undoableAtom)).toMatchObject({
      canUndo: true,
      canRedo: false,
    }) // canUndo changed
    expect(spy).toBeCalledTimes(1)
    store.set(baseAtom, 2)
    expect(store.get(undoableAtom)).toMatchObject({
      canUndo: true,
      canRedo: false,
    }) // no-change
    expect(spy).toBeCalledTimes(1)
    store.set(undoableAtom, UNDO)
    expect(store.get(undoableAtom)).toMatchObject({
      canUndo: true,
      canRedo: true,
    }) // canRedo changed
    expect(spy).toBeCalledTimes(2)
    store.set(undoableAtom, UNDO)
    expect(store.get(undoableAtom)).toMatchObject({
      canUndo: false,
      canRedo: true,
    }) // canUndo changed
    expect(spy).toBeCalledTimes(3)
    store.set(undoableAtom, REDO)
    expect(store.get(undoableAtom)).toMatchObject({
      canUndo: true,
      canRedo: true,
    }) // canUndo changed
    expect(spy).toBeCalledTimes(4)
    store.set(undoableAtom, REDO)
    expect(store.get(undoableAtom)).toMatchObject({
      canUndo: true,
      canRedo: false,
    }) // no-change
    expect(spy).toBeCalledTimes(5)
  })

  it('supports custom getArgs', () => {
    const baseAtom = atom(0, (_, set, a: number, b: number = 0) => {
      set(baseAtom, a + b)
    })
    const historyAtom = withHistory(baseAtom, 3)
    const undoableAtom = withUndo(
      historyAtom,
      baseAtom,
      3,
      (value) => [value, 0] as const
    )
    store.sub(undoableAtom, () => {})
    store.set(baseAtom, 1)
    expect(store.get(baseAtom)).toBe(1)
    store.set(undoableAtom, UNDO)
    expect(store.get(baseAtom)).toBe(0)
    store.set(undoableAtom, REDO)
    expect(store.get(baseAtom)).toBe(1)
  })

  it('resets undo stack with RESET', () => {
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    store.set(undoableAtom, RESET)
    expect(store.get(undoableAtom).canUndo).toBe(false)
    expect(store.get(undoableAtom).canRedo).toBe(false)
  })

  it('removes the current state from the history on UNDO', () => {
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    store.set(undoableAtom, UNDO)
    expect([...store.get(historyAtom)]).toEqual([1, 0])
  })

  it('removes and adds states to history on UNDO and REDO', () => {
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    store.set(undoableAtom, UNDO)
    expect([...store.get(historyAtom)]).toEqual([1, 0])
    store.set(undoableAtom, REDO)
    expect([...store.get(historyAtom)]).toEqual([2, 1, 0])
    store.set(baseAtom, 3)
    expect([...store.get(historyAtom)]).toEqual([3, 2, 1])
    store.set(undoableAtom, UNDO)
    store.set(undoableAtom, UNDO)
    expect([...store.get(historyAtom)]).toEqual([1])
    store.set(undoableAtom, REDO)
    store.set(undoableAtom, REDO)
    expect([...store.get(historyAtom)]).toEqual([3, 2, 1])
  })
})
