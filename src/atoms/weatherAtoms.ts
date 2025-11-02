import { TWeatherDatatMap } from '@/lib/types/externalData/TWeatherDataMap';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';

// ✅ 

export const weatherDataMapAtom = atom<TWeatherDatatMap>({});

export const setWeatherDataForDatestampAtom = atom(
    null,
    (get, set, { datestamp, data }: { datestamp: string; data: TWeatherDatatMap[string] }) => {
        const prev = get(weatherDataMapAtom);
        set(weatherDataMapAtom, {
            ...prev,
            [datestamp]: data,
        });
    }
);

export const weatherForDatestampAtom = atomFamily((datestamp: string) =>
    atom((get) => {
        const map = get(weatherDataMapAtom);
        return map[datestamp] ?? null;
    })
);
