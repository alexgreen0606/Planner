import { atom } from 'jotai';

type ReloadMap = Record<
    string, // the path of the current page
    Record<string, () => Promise<void>>
>;

export const reloadMapAtom = atom<ReloadMap>({});
