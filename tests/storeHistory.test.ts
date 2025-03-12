import { atom, createStore } from 'jotai/vanilla'
import type { PrimitiveAtom } from 'jotai/vanilla'
import { beforeEach, describe, expect, it } from 'vitest'
import { RESET } from '../src/actions'
import { atomWithStoreHistory } from '../src/storeHistory'

describe('storeHistory', () => {
  let store: ReturnType<typeof createStore>
  let historyAtom: ReturnType<typeof atomWithStoreHistory>
  let atom1: PrimitiveAtom<number>
  let atom2: PrimitiveAtom<string>
  let privateAtom: PrimitiveAtom<boolean>
  let unsubHistory: () => void
  let unsubAtom1: () => void

  beforeEach(() => {
    store = createStore()
    historyAtom = atomWithStoreHistory(3) // Limit history to 3 entries
    unsubHistory = store.sub(historyAtom, () => {})

    atom1 = atom(0)
    atom1.debugLabel = 'atom1'
    unsubAtom1 = store.sub(atom1, () => {})

    atom2 = atom('initial')
    atom2.debugLabel = 'atom2'
    store.sub(atom2, () => {})

    privateAtom = atom(false)
    privateAtom.debugPrivate = true
    store.sub(privateAtom, () => {})
  })

  it('should track history of changes to all atoms in a store', () => {
    store.set(atom1, 1)
    store.set(atom1, 2)
    store.set(atom2, 'updated')

    const history = store.get(historyAtom)
    expect(history.get(atom1)).toEqual([2, 1, 0])
    expect(history.get(atom2)).toEqual(['updated', 'initial'])
  })

  it('should not track changes of atoms that are private', () => {
    store.set(atom1, 1)
    store.set(privateAtom, true)

    const history = store.get(historyAtom)
    expect(history.get(atom1)).toEqual([1, 0])
    expect(history.has(privateAtom)).toBe(false)
  })

  it('should track changes across multiple stores', () => {
    const store2 = createStore()
    const historyAtom2 = atomWithStoreHistory(3)
    store2.sub(historyAtom2, () => {})
    store2.sub(atom1, () => {})

    store.set(atom1, 1)
    store2.set(atom1, 2)

    const history1 = store.get(historyAtom)
    const history2 = store2.get(historyAtom2)

    expect(history1.get(atom1)).toEqual([1, 0])
    expect(history2.get(atom1)).toEqual([2, 0])
  })

  it('should limit the history to the specified number of entries', () => {
    store.set(atom1, 1)
    store.set(atom1, 2)
    store.set(atom1, 3)
    store.set(atom1, 4)

    const history = store.get(historyAtom)
    expect(history.get(atom1)?.length).toBe(3)
    expect(history.get(atom1)).toEqual([4, 3, 2])
  })

  it('should reset the history when an atom is reset', () => {
    store.set(atom1, 1)
    store.set(atom1, 2)
    store.set(atom2, 'updated')

    store.set(historyAtom, RESET)

    const history = store.get(historyAtom)
    expect(history.size).toBe(0)
  })

  it('should clear the history when an atom is unmounted', () => {
    store.set(atom1, 1)
    store.set(atom2, 'updated')

    const history = store.get(historyAtom)
    expect(history.has(atom1)).toBe(true)

    // unmount atom1
    unsubAtom1()

    expect(history.has(atom1)).toBe(false)
    expect(history.has(atom2)).toBe(true)
  })

  it('should unsubscribe from store hooks when the atom is unmounted', () => {
    store.set(atom1, 1)

    // Unmount the history atom
    unsubHistory()

    // Create a new atom after unmounting
    const atom3 = atom('new')
    store.sub(atom3, () => {})
    store.set(atom3, 'changed')

    // History should be empty or not track new changes
    const history = store.get(historyAtom)
    expect(history.has(atom3)).toBe(false)

    // Remount to verify it works again
    unsubHistory = store.sub(historyAtom, () => {})
    store.set(atom3, 'changed again')
    expect(store.get(historyAtom).has(atom3)).toBe(true)
  })
})
