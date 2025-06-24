import { EItemStatus } from "@/lib/enums/EItemStatus";
import { ICountdown } from "@/lib/types/listItems/ICountdown";
import { getDatestampThreeYearsFromToday, getTodayDatestamp, isoToDatestamp } from "@/utils/dateUtils";
import * as Calendar from 'expo-calendar';
import { getCalendarMap, loadCalendarData } from "./calendarUtils";
import { getAllMountedDatestamps } from "./plannerUtils";
import { EListType } from "@/lib/enums/EListType";
import { EStorageKey } from "@/lib/enums/EStorageKey";

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
        listId: EStorageKey.COUNTDOWN_LIST_KEY,
        status: EItemStatus.STATIC,
        startIso: calEvent.startDate as string,
        listType: EListType.COUNTDOWN
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
 */
export async function saveCountdown(countdown: ICountdown) {
    const countdownDatestamp = isoToDatestamp(countdown.startIso);
    const allVisibleDatestamps = getAllMountedDatestamps();

    const createNew = countdown.status === EItemStatus.NEW;

    // Tracks the Planner datestamps that will be affected by this update.
    const affectedDatestamps = new Set([countdownDatestamp]);

    const id = await getCountdownCalendarId();

    const eventDetails = {
        title: countdown.value,
        startDate: countdown.startIso,
        endDate: countdown.startIso,
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
 * ✅ Deletes a Countdown from the device calendar.
 * 
 * @param countdowns - The Countdown to delete.
 */
export async function deleteCountdown(countdown: ICountdown) {
    const allVisibleDatestamps = getAllMountedDatestamps();

    // Phase 1: Delete the event from the calendar.
    await Calendar.deleteEventAsync(countdown.id);

    // Phase 2: Reload the calendar data if the event affects the current planners.
    const affectedDatestamps = [];
    for (const datestamp of allVisibleDatestamps) {
        if (countdown.listId === datestamp) {
            affectedDatestamps.push(datestamp);
        }
    }
    await loadCalendarData(affectedDatestamps);

}
