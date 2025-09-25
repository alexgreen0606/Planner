import { ERecurringPlannerId } from '@/lib/enums/ERecurringPlannerKey';
import { atom } from 'jotai';

// ✅ 

export const recurringPlannerIdAtom = atom<ERecurringPlannerId>(ERecurringPlannerId.WEEKDAYS);
