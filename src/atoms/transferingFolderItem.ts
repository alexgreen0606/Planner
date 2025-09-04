import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { atom } from 'jotai';

// ✅ 

export const transferingFolderItemAtom = atom<IFolderItem | null>(null);
