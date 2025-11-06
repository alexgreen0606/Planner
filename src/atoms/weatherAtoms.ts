import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'

import { TWeatherDatatMap } from '@/lib/types/externalData/TWeatherDataMap'

// ✅

const weatherDataMapAtom = atom<TWeatherDatatMap>({})

export const setWeatherForDatestampAtom = atom(
  null,
  (get, set, { datestamp, data }: { datestamp: string; data: TWeatherDatatMap[string] }) => {
    const prev = get(weatherDataMapAtom)
    set(weatherDataMapAtom, {
      ...prev,
      [datestamp]: data,
    })
  },
)

export const getWeatherByDatestampAtom = atomFamily((datestamp: string) =>
  atom((get) => {
    const map = get(weatherDataMapAtom)
    return map[datestamp] ?? null
  }),
)
