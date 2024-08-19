#  History

[jotai-history](https://jotai.org/docs/integrations/history) is a utility package for advanced state history management

## install

```
npm i jotai-history
```

## atomWithHistory

### Signature

```ts
function atomWithHistory<T>(targetAtom: Atom<T>, limit: number): Atom<T[]>
```

This function creates an atom that keeps a history of states for a given `targetAtom`. The `limit` parameter determines the maximum number of history states to keep.
This is useful for tracking the changes over time.

The history atom tracks changes to the `targetAtom` and maintains a list of previous states up to the specified `limit`. When the `targetAtom` changes, its new state is added to the history.

### Usage

```tsx
import { atom, useAtomValue, useSetAtom } from 'jotai'
import { atomWithHistory } from 'jotai/utils'

const countAtom = atom(0)
const countWithPrevious = atomWithHistory(countAtom, 2)

export function CountComponent() {
  const [count, previousCount] = useAtomValue(countWithPrevious)
  const setCount = useSetAtom(countAtom)

  return (
    <>
      <p>Count: {count}</p>
      <p>Previous Count: {previousCount}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </>
  )
}
```

## atomWithUndo

### Signature

```ts
type Undoable<T> = {
  undo: Function
  redo: Function
  canUndo: boolean
  canRedo: boolean
}
function atomWithUndo<T>(targetAtom: PrimitiveAtom<T>, limit: number): Atom<Undoable>
```

`atomWithHistory` provides undo and redo capabilities for an atom. It keeps track of the value history of `targetAtom` and provides methods to move back and forth through that history.

The returned object includes:

- `undo`: A function to revert to the previous state.
- `redo`: A function to advance to the next state.
- `canUndo`: A boolean indicating if it's possible to undo.
- `canRedo`: A boolean indicating if it's possible to redo.

### Usage

```tsx
import { atom, useAtom, useAtomValue } from 'jotai'
import { atomWithUndo } from 'jotai/utils'

const counterAtom = atom(0)
const undoCounterAtom = atomWithUndo(counterAtom, 5)

export function CounterComponent() {
  const { undo, redo, canUndo, canRedo } = useAtomValue(undoCounterAtom)
  const [value, setValue] = useAtom(counterAtom)

  return (
    <>
      <p>Count: {value}</p>
      <button onClick={() => setValue((c) => c + 1)}>Increment</button>
      <button onClick={undo} disabled={!canUndo}>
        Undo
      </button>
      <button onClick={redo} disabled={!canRedo}>
        Redo
      </button>
    </>
  )
}
```

## Example
https://codesandbox.io/p/sandbox/musing-orla-g6qj3q?file=%2Fsrc%2FApp.tsx%3A10%2C23

## Memory Management

⚠️ Since `atomWithHistory` and `atomWithUndo` keeps a history of states, it's important to manage memory by setting a reasonable `limit`. Excessive history can lead to memory bloat, especially in applications with frequent state updates.
