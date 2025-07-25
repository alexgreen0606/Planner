import { EItemStatus } from '@/lib/enums/EItemStatus';
import { EListType } from '@/lib/enums/EListType';
import { EStorageKey } from '@/lib/enums/EStorageKey';
import { ICountdown } from '@/lib/types/listItems/ICountdown';
import * as Calendar from 'expo-calendar';

/**
 * ✅ Converts a calendar event to a Countdown.
 * 
 * @param calEvent - The calendar event to convert.
 * @param sortId - The sort ID for the Countdown. Default is 1.
 * @returns - A new Countdown Event.
 */
export function mapCalendarEventToCountdown(calEvent: Calendar.Event, sortId?: number): ICountdown {
    return {
        id: calEvent.id,
        value: calEvent.title,
        sortId: sortId ?? 1,
        listId: EStorageKey.COUNTDOWN_LIST_KEY,
        status: EItemStatus.STATIC,
        startIso: calEvent.startDate as string,
        listType: EListType.COUNTDOWN
    }
}