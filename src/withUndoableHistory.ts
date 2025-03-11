import type {
  Atom,
  ExtractAtomArgs,
  ExtractAtomResult,
  ExtractAtomValue,
  WritableAtom,
} from 'jotai/vanilla'
import { atom } from 'jotai/vanilla'
import { REDO, RESET, UNDO } from './actions'
import { History, withHistory } from './withHistory'
import { type Indicators, withUndo } from './withUndo'

type WithUndoableHistory<T extends Atom<unknown>> =
  T extends WritableAtom<any, any[], any>
    ? WritableAtom<
        History<ExtractAtomValue<T>> & Indicators,
        ExtractAtomArgs<T> | [RESET | UNDO | REDO],
        ExtractAtomResult<T> | void
      >
    : WritableAtom<History<ExtractAtomValue<T>>, [RESET], void>

export function withUndoableHistory<T extends Atom<unknown>>(
  targetAtom: T,
  limit: number
): WithUndoableHistory<T> {
  const historyAtom = withPrivate(withHistory(targetAtom, limit))
  let undoAtom: ReturnType<typeof withUndo> | undefined
  if (isWritableAtom(targetAtom)) {
    // eslint-disable-next-line prefer-rest-params
    const getArgs = arguments[2] ?? Array.of
    undoAtom = withPrivate(withUndo(historyAtom, targetAtom, limit, getArgs))
  }
  return atom(
    (get) =>
      Object.assign(
        get(historyAtom),
        isWritableAtom(targetAtom) ? get(undoAtom!) : {}
      ),
    (_, set, ...args: unknown[]) => {
      const [action] = args
      if (action === RESET) {
        set(historyAtom, action)
        if (undoAtom) {
          set(undoAtom, action)
        }
      } else if (!isWritableAtom(targetAtom)) {
        return
      } else if (action === UNDO || action === REDO) {
        set(undoAtom!, action)
      } else {
        return set(targetAtom, ...args)
      }
    }
  ) as WithUndoableHistory<T>
}

type InferWritableAtom<T extends Atom<unknown>> =
  T extends WritableAtom<infer Value, infer Args, infer Result>
    ? WritableAtom<Value, Args, Result>
    : never

function isWritableAtom<T extends Atom<unknown>>(
  atom: T
): atom is T & InferWritableAtom<T> {
  return 'write' in atom
}

function withPrivate<T extends Atom<unknown>>(atom: T) {
  atom.debugPrivate = true
  return atom
}
