import React from 'react'
import { useAtom, useAtomValue } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { withUndo } from 'jotai-history'

const searchTextAtom = atom('')
const undoRedoAtom = withUndo<string>(searchTextAtom, 10)

function UndoRedoControls() {
  const { undo, redo, canUndo, canRedo } = useAtomValue(undoRedoAtom)
  return (
    <>
      <button onClick={undo} disabled={!canUndo}>
        Undo
      </button>
      <button onClick={redo} disabled={!canRedo}>
        Redo
      </button>
    </>
  )
}

export function App() {
  const [searchText, setSearchText] = useAtom(searchTextAtom)

  return (
    <>
      <input
        value={searchText}
        placeholder="type to add search text"
        type="text"
        onChange={(e) => setSearchText(e.target.value as string)}
      />
      <div>
        <UndoRedoControls />
      </div>
    </>
  )
}
