import { EStorageId } from '@/lib/enums/EStorageId'

import { TListItem } from './core/TListItem'

// ✅

export type TDateRange = {
  startIso: string
  endIso: string
}

export interface ITimeConfig extends TDateRange {
  allDay: boolean
  calendarId?: string

  // Links multi-day start and end events together.
  startEventId?: string
  endEventId?: string
}

export interface IPlannerEvent extends TListItem {
  timeConfig?: ITimeConfig
  calendarEventId?: string
  recurringId?: string
  storageId: EStorageId.PLANNER_EVENT
}
