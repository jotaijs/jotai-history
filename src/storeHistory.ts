import { type Atom, atom } from 'jotai/vanilla'
import {
  INTERNAL_getBuildingBlocksRev1 as getBuildingBlocks,
  INTERNAL_initializeStoreHooks as initializeStoreHooks,
} from 'jotai/vanilla/internals'
import { RESET } from './actions'

export function atomWithStoreHistory(limit: number) {
  const refreshAtom = atom(0)
  refreshAtom.debugPrivate = true
  const historyAtom = atom(() => new Map<Atom<unknown>, unknown[]>())
  historyAtom.debugPrivate = true
  const refreshableHistoryAtom = atom(
    (get) => (get(refreshAtom), get(historyAtom)),
    (get, set, action: RESET) => {
      if (action === RESET) {
        get(historyAtom).clear()
        set(refreshAtom, (v) => v + 1)
      } else {
        throw new Error('Invalid action')
      }
    }
  )
  refreshableHistoryAtom.debugPrivate = true
  refreshableHistoryAtom.unstable_onInit = (store) => {
    const buildingBlocks = getBuildingBlocks(store)
    const mountedMap = buildingBlocks[1]
    const storeHooks = initializeStoreHooks(buildingBlocks[6])
    const atomHistory = store.get(historyAtom)!
    let hasChanged = false
    const subscribeAll = (): (() => void) =>
      collectFns(
        storeHooks.c.add(undefined, function onChange(atom) {
          if (atom.debugPrivate) {
            return
          }
          if (mountedMap.has(atom) && !atomHistory.has(atom)) {
            atomHistory.set(atom, [])
          }
          const history = atomHistory.get(atom)
          if (!history) {
            return
          }
          atomHistory.set(atom, [store.get(atom), ...history].slice(0, limit))
          hasChanged = true
        }),
        storeHooks.m.add(undefined, function onMount(atom) {
          if (atom.debugPrivate) {
            return
          }
          atomHistory.set(atom, [store.get(atom)])
          hasChanged = true
        }),
        storeHooks.u.add(undefined, function onUnmount(atom) {
          if (atom.debugPrivate) {
            return
          }
          atomHistory.delete(atom)
          hasChanged = true
        }),
        storeHooks.f.add(function onFlush() {
          // refresh the history atom on flush
          if (hasChanged) {
            hasChanged = false
            store.set(refreshAtom, (v) => v + 1)
          }
        })
      )
    let unsubscribeAll: () => void
    storeHooks.m.add(refreshableHistoryAtom, function subOnMount() {
      unsubscribeAll = subscribeAll()
    })
    storeHooks.u.add(refreshableHistoryAtom, function unsubOnMount() {
      unsubscribeAll()
    })
  }
  return refreshableHistoryAtom
}

function collectFns(...fns: (() => void)[]) {
  return () => fns.forEach(callFn)
}

function callFn(fn: () => void) {
  return fn()
}
