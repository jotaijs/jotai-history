# jotai-history

[jotai-history](https://jotai.org/docs/extensions/history) is a utility package for tracking state history in Jotai.

## Installation

```
npm install jotai-history
```

## `withHistory`

```js
import { withHistory } from 'jotai-history'

const targetAtom = atom(0)
const limit = 2
const historyAtom = withHistory(targetAtom, limit)

function Component() {
  const [current, previous] = useAtomValue(historyAtom)
  ...
}
```

### Description

`withHistory` creates an atom that tracks the history of states for a given `targetAtom`. The most recent `limit` states are retained.

### Action Symbols

- **RESET**  
  Clears the entire history, removing all previous states (including the undo/redo stack).
  ```js
  import { RESET } from 'jotai-history'

  ...

  function Component() {
    const setHistoryAtom = useSetAtom(historyAtom)
    ...
    setHistoryAtom(RESET)
  }
  ```

- **UNDO** and **REDO**  
  Moves the `targetAtom` backward or forward in its history.
  ```js
  import { REDO, UNDO } from 'jotai-history'

  ...

  function Component() {
    const setHistoryAtom = useSetAtom(historyAtom)
    ...
    setHistoryAtom(UNDO)
    setHistoryAtom(REDO)
  }
  ```

### Indicators

- **canUndo** and **canRedo**  
  Booleans indicating whether undo or redo actions are currently possible. These can be used to disable buttons or conditionally trigger actions.

  ```jsx
  ...

  function Component() {
    const history = useAtomValue(historyAtom)

    return (
      <>
        <button disabled={!history.canUndo}>Undo</button>
        <button disabled={!history.canRedo}>Redo</button>
      </>
    )
  }
  ```

<CodeSandbox id="g6qj3q" />

## Memory Management

> Because `withHistory` maintains a list of previous states, be mindful of memory usage by setting a reasonable `limit`. Applications that update state frequently can grow significantly in memory usage.
