import { atom, createStore } from 'jotai/vanilla'
import type { PrimitiveAtom } from 'jotai/vanilla'
import { beforeEach, describe, expect, it } from 'vitest'
import { RESET } from '../src/actions'
import { withHistory } from '../src/withHistory'

describe('withHistory', () => {
  let store: ReturnType<typeof createStore>
  let baseAtom: PrimitiveAtom<number>
  let historyAtom: ReturnType<typeof withHistory<number>>
  let unsub: () => void

  beforeEach(() => {
    store = createStore()
    baseAtom = atom(0) // Initial value is 0
    historyAtom = withHistory(baseAtom, 3) // Limit history to 3 entries
    unsub = store.sub(historyAtom, () => {}) // Subscribe to trigger onMount
  })

  it('tracks history of changes', () => {
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    expect([...store.get(historyAtom)]).toEqual([2, 1, 0]) // History should track changes
  })

  it('enforces history limit', () => {
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    store.set(baseAtom, 3)
    store.set(baseAtom, 4)
    expect(store.get(historyAtom).length).toBe(3) // Length should not exceed limit
    expect([...store.get(historyAtom)]).toEqual([4, 3, 2]) // Only the most recent 3 states are kept
  })

  it('cleans up history on unmount', () => {
    store.set(baseAtom, 1)
    expect([...store.get(historyAtom)]).toEqual([1, 0]) // History before unmount
    unsub() // Unsubscribe to unmount
    unsub = store.sub(historyAtom, () => {}) // Subscribe to mount
    expect([...store.get(historyAtom)]).toEqual([1]) // History should be cleared
  })

  it('resets history with RESET', () => {
    store.set(baseAtom, 1)
    store.set(baseAtom, 2)
    store.set(historyAtom, RESET)
    expect([...store.get(historyAtom)]).toEqual([2]) // History should be reset
  })
})
