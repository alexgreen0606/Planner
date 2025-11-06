import { atom } from 'jotai';

import { ERecurringPlannerId } from '@/lib/enums/ERecurringPlannerKey';

export const recurringPlannerIdAtom = atom<ERecurringPlannerId>(ERecurringPlannerId.WEEKDAYS);
