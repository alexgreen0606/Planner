import { EItemStatus } from "@/lib/enums/EItemStatus";
import { ICountdown } from "@/lib/types/listItems/ICountdown";
import { getDatestampThreeYearsFromToday, getTodayDatestamp, isoToDatestamp } from "@/utils/dateUtils";
import * as Calendar from 'expo-calendar';
import { generateCalendarIdToCalendarMap, loadCalendarDataToStore } from "./calendarUtils";
import { mapCalendarEventToCountdown } from "./map/mapCalendarEventToCountdown";
import { getAllMountedDatestampsFromStore } from "./plannerUtils";

// ✅ 

// ====================
// 1. Helper Functions
// ====================

async function getCountdownCalendarId(): Promise<string> {
    const calendarMap = await generateCalendarIdToCalendarMap();
    const countdownCalendar = Object.values(calendarMap).find(calendar => calendar.title === 'Countdowns');

    return countdownCalendar?.id ?? await Calendar.createCalendarAsync({
        title: 'Countdowns',
        color: 'rgb(255,56,60)',
        entityType: Calendar.EntityTypes.EVENT,
        name: 'Countdowns',
        ownerAccount: 'PlannerApp'
    });
}

async function getCountdownDatestamp(eventId: string): Promise<string> {
    const calendarEvent = await Calendar.getEventAsync(eventId);
    if (!calendarEvent) throw new Error(`getCountdownEventDatestamp: Countdown does not exist with ID ${eventId}`);

    return isoToDatestamp(calendarEvent.startDate as string);
}

// ===================
// 2. Upsert Function
// ===================

/**
 * Updates or creates an event in the Countdown Calendar and reloads the Calendar data.
 * 
 * @param countdown The countdown to update or create.
 */
export async function upsertCountdownAndReloadCalendar(countdown: ICountdown) {
    const countdownDatestamp = isoToDatestamp(countdown.startIso);
    const allVisibleDatestamps = getAllMountedDatestampsFromStore();

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
        const existingEventDatestamp = await getCountdownDatestamp(countdown.id);
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
    await loadCalendarDataToStore(datestampsToReload);
}

// ===================
// 3. Getter Function
// ===================

/**
 * Fetches all future and current events from the Countdown Calendar.
 * 
 * @returns All list of Countdowns.
 */
export async function getAllFutureAndCurrentCountdowns(): Promise<ICountdown[]> {
    const startDate = new Date(`${getTodayDatestamp()}T00:00:00`);
    const endDate = new Date(`${getDatestampThreeYearsFromToday()}T23:59:59`);

    const id = await getCountdownCalendarId();
    const calendarEvents = await Calendar.getEventsAsync([id], startDate, endDate);

    return calendarEvents.map((calEvent, i) => mapCalendarEventToCountdown(calEvent, i + 1));
}

// ===================
// 4. Delete Function
// ===================

/**
 * Deletes a Countdown from the device calendar.
 * 
 * @param countdown The Countdown to delete.
 */
export async function deleteCountdownAndReloadCalendar(countdown: ICountdown) {
    const allVisibleDatestamps = getAllMountedDatestampsFromStore();

    // Phase 1: Delete the event from the calendar.
    await Calendar.deleteEventAsync(countdown.id);

    // Phase 2: Reload the calendar data if the event affects the current planners.
    const affectedDatestamps = [];
    for (const datestamp of allVisibleDatestamps) {
        if (countdown.listId === datestamp) {
            affectedDatestamps.push(datestamp);
        }
    }

    await loadCalendarDataToStore(affectedDatestamps);
}