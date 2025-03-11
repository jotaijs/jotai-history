#  History

[jotai-history](https://jotai.org/docs/extensions/history) is a utility package that provides a history of Jotai atom states, making it easy to track and manage changes over time. It also includes undo and redo actions to revert or restore previous states as needed.

## Installation

```bash
npm i jotai-history
```

## withHistory

```ts
type Actions<T> = {
  // Clears the history
  reset: () => void
  // Reverts to the previous state
  undo: () => void
  // Advances to the next state
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

function withHistory<T>(
  targetAtom: Atom<T>,
  limit: number
): Atom<T[] & Actions<T>>
```

**Description**

`withHistory` creates an atom that tracks the history of states for a given `targetAtom`. The `limit` parameter specifies how many past states to keep in memory. Whenever the `targetAtom` changes, its new state is immediately added to the history, up to the specified limit.

### Actions

- **reset**  
  Clears the entire history, removing all previous states.

- **undo** and **redo**  
  Move the `targetAtom` backward or forward in its history, respectively.

- **canUndo** and **canRedo**  
  Booleans indicating whether undo or redo actions are currently possible. These can be used to disable buttons or conditionally trigger actions.

### Usage

```jsx
import { atom, useAtomValue, useSetAtom } from 'jotai'
import { withHistory } from 'jotai-history'

const countAtom = atom(0)

// Set how many states to keep
const limit = 2

// Create a new atom that maintains history
const countWithHistory = withHistory(countAtom, limit)

function CountComponent() {
  const history = useAtomValue(countWithHistory)
  const [currentCount, previousCount] = history
  const setCount = useSetAtom(countAtom)

  return (
    <>
      <button onClick={() => setCount((v) => v + 1)}>Increment</button>
      <p>Current Count: {currentCount}</p>
      <p>Previous Count: {previousCount}</p>
      
      <button onClick={history.reset}>Reset History</button>
      <button onClick={history.undo} disabled={!history.canUndo}>
        Undo
      </button>
      <button onClick={history.redo} disabled={!history.canRedo}>
        Redo
      </button>
    </>
  )
}
```

<CodeSandbox id="g6qj3q" />

## Memory Management

⚠️ Because `withHistory` maintains a list of previous states, be mindful of memory usage by setting a reasonable `limit`. Applications that update state frequently can grow in memory usage if the limit is too large.
