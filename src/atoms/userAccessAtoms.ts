import { atom } from 'jotai';

import { EAccess } from '@/lib/enums/EAccess';

type TPermissions = Record<EAccess, boolean | undefined>;

export const permissionsAtom = atom<TPermissions>({
  [EAccess.CALENDAR]: undefined,
  [EAccess.CONTACTS]: undefined
});
