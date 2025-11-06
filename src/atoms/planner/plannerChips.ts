import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'

import { TPlannerChipMap } from '@/lib/types/externalData/TPlannerChipMap'

// ✅

const plannerChipsMapAtom = atom<TPlannerChipMap>({})

export const plannerChipsByDatestamp = atomFamily((datestamp: string) =>
  atom((get) => get(plannerChipsMapAtom)[datestamp] ?? []),
)

export const savePlannerChipDataAtom = atom(null, (get, set, newData: TPlannerChipMap) => {
  const prev = get(plannerChipsMapAtom)
  set(plannerChipsMapAtom, { ...prev, ...newData })
})
