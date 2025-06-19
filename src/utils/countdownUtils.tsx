import { visibleDatestampsAtom } from "@/atoms/visibleDatestamps";
import { StorageKey } from "@/lib/constants/storage";
import { EItemStatus } from "@/lib/enums/EItemStatus";
import { ICountdown } from "@/lib/types/listItems/ICountdown";
import { getDatestampThreeYearsFromToday, getTodayDatestamp, isoToDatestamp } from "@/utils/dateUtils";
import { jotaiStore } from "app/_layout";
import * as Calendar from 'expo-calendar';
import { getCalendarMap, loadCalendarData } from "./calendarUtils";
import { getAllVisibleDatestamps } from "./plannerUtils";

/**
 * ✅ Converts a calendar event to a Countdown.
 * 
 * @param calEvent - The calendar event to convert.
 * @param sortId - The sort ID for the Countdown.
 * @returns - A new Countdown Event.
 */
function calendarEventToCountdown(calEvent: Calendar.Event, sortId?: number): ICountdown {
    return {
        id: calEvent.id,
        value: calEvent.title,
        sortId: sortId ?? 1,
        listId: StorageKey.COUNTDOWN_LIST_KEY,
        status: EItemStatus.STATIC,
        startTime: calEvent.startDate as string
    }
}

/**
 * ✅ Fetches the Countdown Calendar from the device and returns its ID.
 * If the Countdown Calendar does not exist, a new one will be created.
 * 
 * @returns - The ID of the device's countdown calendar.
 */
async function getCountdownCalendarId(): Promise<string> {
    const calendarMap = await getCalendarMap();
    const countdownCalendar = Object.values(calendarMap).find(calendar => calendar.title === 'Countdowns');

    return countdownCalendar?.id ?? await Calendar.createCalendarAsync({
        title: 'Countdowns',
        color: 'rgb(255,56,60)',
        entityType: Calendar.EntityTypes.EVENT,
        name: 'Countdowns',
        ownerAccount: 'PlannerApp'
    });
}

/**
 * ✅ Fetches a Countdown event from the device calendar and returns the datestamp it exists in.
 * 
 * @param eventId - The ID representing the Countdown in the device calendar.
 * @returns - The datestamp the Countdown exists in.
 */
export async function getCountdownEventDatestamp(eventId: string): Promise<string> {

    const calendarEvent = await Calendar.getEventAsync(eventId);
    if (!calendarEvent) console.error('Countdown does not exist with ID', eventId);

    return isoToDatestamp(calendarEvent.startDate as string);
}

/**
 * ✅ Fetches all events from the Countdown Calendar.
 * 
 * @returns - All events from the Countdown Calendar.
 */
export async function getCountdowns(): Promise<ICountdown[]> {
    const startDate = new Date(`${getTodayDatestamp()}T00:00:00`);
    const endDate = new Date(`${getDatestampThreeYearsFromToday()}T23:59:59`);

    const id = await getCountdownCalendarId();
    const calendarEvents = await Calendar.getEventsAsync([id], startDate, endDate);

    return calendarEvents.map((calEvent, i) => calendarEventToCountdown(calEvent, i + 1));
}

/**
 * ✅ Updates or creates an event in the Countdown Calendar.
 * 
 * @param countdown - The event to update or create.
 * @param createNew - Signifies if the event exists or should be created anew. Default is false.
 */
export async function saveCountdown(countdown: ICountdown, createNew: boolean = false) {
    const allVisibleDatestamps = getAllVisibleDatestamps();
    const countdownDatestamp = isoToDatestamp(countdown.startTime);

    // Tracks the Planner datestamps that will be affected by this update.
    const affectedDatestamps = new Set([countdownDatestamp]);

    const id = await getCountdownCalendarId();

    const eventDetails = {
        title: countdown.value,
        startDate: countdown.startTime,
        endDate: countdown.startTime,
        allDay: true
    };

    // Phase 1: Update the device calendar.
    if (createNew) {
        await Calendar.createEventAsync(id, eventDetails);
    } else {
        const existingEventDatestamp = await getCountdownEventDatestamp(countdown.id);
        affectedDatestamps.add(existingEventDatestamp);

        await Calendar.updateEventAsync(countdown.id, eventDetails);
    }

    // Phase 2: Reload the calendar data if this event affects the current planners.
    const datestampsToReload = [];
    for (const datestamp of allVisibleDatestamps) {
        if (affectedDatestamps.has(datestamp)) {
            datestampsToReload.push(datestamp);
        }
    }
    await loadCalendarData(datestampsToReload);
}

/**
 * ✅ Deletes a list of Countdowns from the device calendar.
 * 
 * @param countdowns - The list of Countdowns to delete.
 */
export async function deleteCountdowns(countdowns: ICountdown[]) {
    const allVisibleDatestamps = getAllVisibleDatestamps();

    // Phase 1: Delete all the events from the calendar.
    await Promise.all(
        countdowns.map(countdown => Calendar.deleteEventAsync(countdown.id))
    );

    // Phase 2: Reload the calendar data if any of the events affect the current planners.
    const affectedDatestamps = [];
    for (const datestamp of allVisibleDatestamps) {
        if (countdowns.some(event => event.listId === datestamp)) {
            affectedDatestamps.push(datestamp);
        }
    }
    await loadCalendarData(affectedDatestamps);

}
