import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';

import { TWeatherData } from '@/lib/types/externalData/TWeatherData';

// Maps datestamps to weather data.
type TWeatherDatatMap = Record<string, TWeatherData>;

// Stores weather data loaded in for each visited planner.
const weatherDataMapAtom = atom<TWeatherDatatMap>({});

// Sets the weather for a given datestamp to weatherDataMapAtom.
export const setWeatherForDatestampAtom = atom(
  null,
  (get, set, { datestamp, data }: { datestamp: string; data: TWeatherDatatMap[string] }) => {
    const prev = get(weatherDataMapAtom);
    set(weatherDataMapAtom, {
      ...prev,
      [datestamp]: data
    });
  }
);

// Returns the weather data for a given datestamp from weatherDataMapAtom.
export const getWeatherByDatestampAtom = atomFamily((datestamp: string) =>
  atom((get) => {
    const map = get(weatherDataMapAtom);
    return map[datestamp] ?? null;
  })
);
