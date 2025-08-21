import { EStorageId } from '@/lib/enums/EStorageId';
import { EStorageKey } from '@/lib/enums/EStorageKey';
import { ICountdown } from '@/lib/types/listItems/ICountdown';
import * as Calendar from 'expo-calendar';

/**
 * Converts a calendar event to a Countdown.
 * 
 * @param calEvent - The calendar event to convert.
 * @param sortId - The sort ID for the Countdown. Default is 1.
 * @returns - A new Countdown Event.
 */
export function mapCalendarEventToCountdown(calEvent: Calendar.Event, sortId?: number): ICountdown {
    return {
        id: calEvent.id,
        value: calEvent.title,
        listId: EStorageKey.COUNTDOWN_LIST_KEY,
        startIso: calEvent.startDate as string,
        storageId: EStorageId.BIRTHDAY // TODO: change
    }
}