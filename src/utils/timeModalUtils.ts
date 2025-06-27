import { IDateRange, IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { deletePlannerEvents, getPlannerFromStorage, sanitizeRecurringEventForSave, saveEventToPlanner, savePlannerEvent } from "@/storage/plannerStorage";
import { EventSourceType, FormData, InitialEventState } from "app/(modals)/timeModal/[datestamp]/[eventId]/[sortId]/[eventValue]";
import * as Calendar from "expo-calendar";
import { DateTime } from "luxon";
import { getPrimaryCalendarId, loadCalendarData } from "./calendarUtils";
import { getMountedDatestampsLinkedToDateRanges } from "./plannerUtils";
import { EListType } from "@/lib/enums/EListType";
import { isoToDatestamp } from "./dateUtils";
import { generateSortId } from "./listUtils";
import { EItemStatus } from "@/lib/enums/EItemStatus";
import { uuid } from "expo-modules-core";

// ------------- Helper Utilities -------------

/**
 * ✅ Updates an event with the Time Modal form data.
 * 
 * @param formData - The data from the Time Modal.
 * @param event - The event to sync.
 * @returns - An event with the Time Modal data.
 */
function syncFormDataToEvent(formData: FormData, event: IPlannerEvent) {
    const { title, timeRange: { startIso, endIso }, allDay } = formData;
    return {
        ...event,
        value: title,
        timeConfig: {
            startIso,
            endIso,
            allDay
        }
    }
}



// ------------- Form Save Utilities -------------

/**
 * ✅ Saves a full day event to the calendar and handles all side effects, including calendar reload and
 * original event deletion.
 * 
 * @param formData - The data from the time modal to save.
 * @param originalData - The state of the event before the update.
 */
export async function saveCalendarChip(
    formData: FormData,
    originalData: InitialEventState
) {
    const { title, timeRange: { startIso, endIso }, allDay } = formData;
    const updatingDateRanges: IDateRange[] = [formData.timeRange];
    let prevCalendarId: string | undefined;
    let prevAllDay: boolean | undefined;

    const eventDetails: Partial<Calendar.Event> = {
        title,
        startDate: startIso,
        endDate: endIso,
        allDay
    };

    // Phase 1: Extract previous date ranges and event data.
    switch (originalData.type) {
        case EventSourceType.CALENDAR_CHIP:
            prevCalendarId = originalData.event.event.id;
            prevAllDay = originalData.event.event.allDay;
            updatingDateRanges.push({
                startIso: originalData.event.event.startDate as string,
                endIso: originalData.event.event.endDate as string,
            });
            break;
        case EventSourceType.PLANNER_EVENT:
            prevCalendarId = originalData.event.calendarId;
            const prevTimeConfig = originalData.event.timeConfig;
            if (prevCalendarId && prevTimeConfig) {
                prevAllDay = prevTimeConfig.allDay;
                updatingDateRanges.push({
                    startIso: prevTimeConfig.startIso,
                    endIso: prevTimeConfig.endIso
                });
            }
            await deletePlannerEvents([originalData.event], true);
            break;
    }

    // Phase 2: (Special Case) During all-day creation, the end date must shift to the start of the next day.
    if (!prevAllDay) {
        const endDate = DateTime.fromISO(endIso);
        const startOfNextDay = endDate
            .plus({ days: 1 })
            .startOf('day')
            .toUTC()
            .toISO()!;
        eventDetails.endDate = startOfNextDay;
    }

    // Phase 3: Device calendar update.
    if (prevCalendarId) {
        // Update existing calendar event.
        await Calendar.updateEventAsync(
            prevCalendarId,
            eventDetails,
            { futureEvents: false }
        );
    } else {
        // Create new calendar event.
        const primaryCalendarId = await getPrimaryCalendarId();
        await Calendar.createEventAsync(primaryCalendarId, eventDetails);
    }

    // Phase 4: Device calendar reload.
    const affectedDatestamps = getMountedDatestampsLinkedToDateRanges(updatingDateRanges);
    await loadCalendarData(affectedDatestamps);
}

/**
 * Saves a calendar event to storage and the device calendar. All side effects will be handled,
 * including clonig of recurring events and calendar reloading.
 * 
 * @param formData - The data from the Time Modal.
 * @param originalData - The state of the event before the update.
 * @returns - The sort ID of the saved event.
 */
export async function saveCalendarEventToPlanner(
    formData: FormData,
    originalData: InitialEventState
): Promise<number> {
    const { title, timeRange: { startIso, endIso }, allDay } = formData;
    const updatingDateRanges: IDateRange[] = [formData.timeRange];
    let event: IPlannerEvent;
    let staleStorageId: string | undefined = undefined;

    const targetDatestamp = isoToDatestamp(startIso);
    const planner = getPlannerFromStorage(targetDatestamp);

    const eventDetails: Partial<Calendar.Event> = {
        title,
        startDate: startIso,
        endDate: endIso,
        allDay
    };

    // Phase 1: Extract previous date ranges and event data.
    switch (originalData.type) {
        case EventSourceType.CALENDAR_CHIP:
            event = {
                id: "PLACEHOLDER", // Calendar ID will overwrite below
                sortId: generateSortId(-1, planner.events),
                listType: EListType.PLANNER,
                listId: targetDatestamp,
                value: title,
                timeConfig: {
                    allDay,
                    startIso: startIso,
                    endIso: endIso
                },
                status: EItemStatus.STATIC
            };
            updatingDateRanges.push({
                startIso: originalData.event.event.startDate as string,
                endIso: originalData.event.event.endDate as string,
            });
            break;
        case EventSourceType.PLANNER_EVENT:
            event = syncFormDataToEvent(formData, originalData.event);
            const prevTimeConfig = originalData.event.timeConfig;
            if (prevTimeConfig) {
                updatingDateRanges.push({
                    startIso: prevTimeConfig.startIso,
                    endIso: prevTimeConfig.endIso
                });
            }
            staleStorageId = originalData.event.id;
            sanitizeRecurringEventForSave(event, planner, originalData.event);
            break;
        case EventSourceType.NEW:
            event = {
                id: "PLACEHOLDER", // Calendar ID will overwrite below
                sortId: originalData.landingSortId,
                listType: EListType.PLANNER,
                listId: targetDatestamp,
                value: title,
                timeConfig: {
                    allDay,
                    startIso: startIso,
                    endIso: endIso
                },
                status: EItemStatus.STATIC
            };
            break;
        default:
            throw new Error(`Invalid event source type in saveCalendarEventToPlanner.`)
    }

    // Phase 3: Device calendar update.
    if (event.calendarId) {
        await Calendar.updateEventAsync(
            event.calendarId,
            eventDetails,
            { futureEvents: false }
        );
    } else {
        const primaryCalendarId = await getPrimaryCalendarId();
        const calId = await Calendar.createEventAsync(primaryCalendarId, eventDetails);
        event.id = calId;
        event.calendarId = calId;
    }

    // Phase 4: Save the event to storage.
    const sortId = saveEventToPlanner(event, planner, staleStorageId);

    // Phase 5: Reload the calendar data.
    const affectedDatestamps = getMountedDatestampsLinkedToDateRanges(updatingDateRanges);
    await loadCalendarData(affectedDatestamps);
    return sortId;
}

/**
 * ✅ Saves a standard timed event to storage. All side effects will be handled,
 * including clonig of recurring events and calendar reloading.
 * 
 * @param formData - The data from the Time Modal.
 * @param originalData - The state of the event before the update.
 * @returns The sort ID of the saved event.
 */
export async function saveTimedEventToPlanner(
    formData: FormData,
    originalData: InitialEventState
): Promise<number> {
    const { title, timeRange: { startIso, endIso }, allDay } = formData;
    const updatingDateRanges: IDateRange[] = [];
    let event: IPlannerEvent;

    const targetDatestamp = isoToDatestamp(startIso);
    const planner = getPlannerFromStorage(targetDatestamp);

    // Phase 1: Extract previous date ranges and event data.
    switch (originalData.type) {
        case EventSourceType.CALENDAR_CHIP:
            updatingDateRanges.push({
                startIso: originalData.event.event.startDate as string,
                endIso: originalData.event.event.endDate as string
            });
            await Calendar.deleteEventAsync(originalData.event.event.id, { futureEvents: false });
            event = {
                id: originalData.event.event.id,
                sortId: generateSortId(-1, planner.events),
                listType: EListType.PLANNER,
                listId: targetDatestamp,
                value: title,
                timeConfig: {
                    allDay,
                    startIso: startIso,
                    endIso: endIso
                },
                status: EItemStatus.STATIC
            };
            break;
        case EventSourceType.PLANNER_EVENT:
            event = syncFormDataToEvent(formData, originalData.event);
            const prevCalendarId = originalData.event.calendarId;
            const prevTimeConfig = originalData.event.timeConfig!;
            if (prevCalendarId) {
                await Calendar.deleteEventAsync(prevCalendarId, { futureEvents: false });
                updatingDateRanges.push({
                    startIso: originalData.event.timeConfig!.startIso,
                    endIso: originalData.event.timeConfig!.endIso
                });
            }
            if (prevTimeConfig) {
                updatingDateRanges.push({
                    startIso: prevTimeConfig.startIso,
                    endIso: prevTimeConfig.endIso
                });
            }
            event = sanitizeRecurringEventForSave(event, planner, originalData.event);
            break;
        case EventSourceType.NEW:
            event = {
                id: uuid.v4(),
                sortId: originalData.landingSortId,
                listType: EListType.PLANNER,
                listId: targetDatestamp,
                value: title,
                timeConfig: {
                    allDay,
                    startIso: startIso,
                    endIso: endIso
                },
                status: EItemStatus.STATIC
            };
            break;
        default:
            throw new Error(`Invalid event source type in saveCalendarEventToPlanner.`)
    }

    // Phase 2: Save the event to storage.
    const sortId = saveEventToPlanner(event, planner);

    // Phase 3: Reload the calendar data.
    const affectedDatestamps = getMountedDatestampsLinkedToDateRanges(updatingDateRanges);
    await loadCalendarData(affectedDatestamps);
    return sortId;
}