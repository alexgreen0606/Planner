import { EStorageId } from '@/lib/enums/EStorageId'

import { TListItem } from './core/TListItem'

// ✅

export interface IRecurringEvent extends TListItem {
  startTime?: string // HH:MM
  weekdayEventId?: string
  storageId: EStorageId.RECURRING_PLANNER_EVENT
}
