import React from 'react'
import { useAtom, useAtomValue } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { atomWithUndo } from 'jotai-history'

const baseSearchTextAtom = atom('')
const searchTextAtom = atomWithUndo<string>(baseSearchTextAtom, 10)

export function App() {
  const { undo, redo, canUndo, canRedo } = useAtomValue(searchTextAtom)
  const [searchText, setSearchText] = useAtom(baseSearchTextAtom)

  return (
    <>
      <input
        value={searchText}
        placeholder="type to add search text"
        type="text"
        onChange={(e) => setSearchText(e.target.value as string)}
      />
      <div>
        <button onClick={undo} disabled={!canUndo}>
          Undo
        </button>
        <button onClick={redo} disabled={!canRedo}>
          Redo
        </button>
      </div>
    </>
  )
}
