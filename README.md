#  History

[jotai-history](https://jotai.org/docs/extensions/history) is a utility package that provides a history of Jotai atom states, making it easy to track and manage changes over time. It also includes support for undo and redo actions to revert or restore previous states as needed.

## Installation

```bash
npm i jotai-history
```

## withHistory

```ts
type Indicators<T> = {
  canUndo: boolean
  canRedo: boolean
}

function withHistory<T>(
  targetAtom: Atom<T>,
  limit: number
): Atom<T[] & Indicators<T>>
```

**Description**

`withHistory` creates an atom that tracks the history of states for a given `targetAtom`. The `limit` parameter specifies how many past states to keep in memory. Whenever the `targetAtom` changes, its new state is immediately added to the history, up to the specified limit.

### Action Symbols

- **RESET**  
  Clears the entire history, removing all previous states including the undo/redo stack.

- **UNDO** and **REDO**  
  Move the `targetAtom` backward or forward in its history, respectively.

### Indicators

- **canUndo** and **canRedo**  
  Booleans indicating whether undo or redo actions are currently possible. These can be used to disable buttons or conditionally trigger actions.

### Usage

```jsx
import { atom, useAtom, useSetAtom } from 'jotai'
import { REDO, RESET, UNDO, withHistory } from 'jotai-history'

const countAtom = atom(0)

// Set how many states to keep
const limit = 2

// Create a new atom that maintains history
const countWithHistory = withHistory(countAtom, limit)

function CountComponent() {
  const [history, dispatch] = useAtom(countWithHistory)
  const [currentCount, previousCount] = history
  const setCount = useSetAtom(countAtom)

  return (
    <>
      <button onClick={() => setCount((v) => v + 1)}>Increment</button>
      <p>Current Count: {currentCount}</p>
      <p>Previous Count: {previousCount}</p>
      
      <button onClick={() => dispatch(RESET)}>Reset History</button>
      <button onClick={() => dispatch(UNDO)} disabled={!history.canUndo}>
        Undo
      </button>
      <button onClick={() => dispatch(REDO)} disabled={!history.canRedo}>
        Redo
      </button>
    </>
  )
}
```

<CodeSandbox id="g6qj3q" />

## Memory Management

⚠️ Because `withHistory` maintains a list of previous states, be mindful of memory usage by setting a reasonable `limit`. Applications that update state frequently can grow in memory usage if the limit is too large.
