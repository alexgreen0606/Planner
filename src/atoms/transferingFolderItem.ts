import { atom } from 'jotai';

import { IFolderItem } from '@/lib/types/listItems/IFolderItem';

export const transferingFolderItemAtom = atom<IFolderItem | null>(null);
