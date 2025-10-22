import { ECarryoverEventType, EEventType } from "@/lib/enums/plannerEventModalEnums";
import { TCarryoverEventMetadata, TInitialEventMetadata } from "@/lib/types/form/plannerEventMetadata";
import { TDateRange } from "@/lib/types/listItems/IPlannerEvent";
import { deletePlannerEventFromStorageById, getPlannerEventFromStorageById, getPlannerFromStorageByDatestamp, savePlannerToStorage } from "@/storage/plannerStorage";
import * as Calendar from "expo-calendar";
import { isoToDatestamp } from "./dateUtils";
import { deletePlannerEventsFromStorageAndCalendar } from "./plannerUtils";

// ✅ 

type TCarryoverEventMap = Partial<Record<ECarryoverEventType, TCarryoverEventMetadata>>;

// ==================
//  Helper Functions
// ==================

function removeRecurringEventFromPlannerInStorage(eventId: string) {
    const event = getPlannerEventFromStorageById(eventId);
    const planner = getPlannerFromStorageByDatestamp(event.listId);
    planner.deletedRecurringEventIds.push(eventId);
    savePlannerToStorage(planner);
}

function getEventMetadataAndCleanPreviousPlanner(eventId: string, hasMovedPlanners: boolean): TCarryoverEventMetadata {
    if (hasMovedPlanners) {
        removeEventIdFromPlannerInStorage(eventId);
    }
    return {
        id: eventId,
        index: hasMovedPlanners ? null : getPlannerEventIndex(eventId)
    }
}

function getHasEventMovedPlanners(prevDatestamp: string, newIso: string): boolean {
    return prevDatestamp !== isoToDatestamp(newIso);
}

function getPlannerEventIndex(eventId: string): number {
    const event = getPlannerEventFromStorageById(eventId);
    const planner = getPlannerFromStorageByDatestamp(event.listId);
    return planner.eventIds.findIndex((id) => id === eventId);
}

function removeEventIdFromPlannerInStorage(eventId: string) {
    const event = getPlannerEventFromStorageById(eventId);
    const planner = getPlannerFromStorageByDatestamp(event.listId);
    savePlannerToStorage({
        ...planner,
        eventIds: planner.eventIds.filter((id) => id !== eventId)
    });
}

function getCalendarEventTimeRange(event: Calendar.Event) {
    return {
        startIso: event.startDate as string,
        endIso: event.endDate as string
    }
}

async function getCanUseCalendarIdElseCleanCalendar(
    previousCalendarId?: string,
    previousCalendarEventId?: string,
    newCalendarId?: string
): Promise<boolean> {
    if (!previousCalendarId || !previousCalendarEventId) return false;

    if (previousCalendarId !== newCalendarId) {
        try {
            await Calendar.deleteEventAsync(previousCalendarEventId);
        } catch (err) {
            console.warn('Failed to delete stale calendar event:', err);
        } finally {
            return false;
        }
    }

    return true;
}

// ======================
//  Transition Functions
// ======================

export async function transitionToAllDayCalendarEvent(initialState: TInitialEventMetadata, newRange: TDateRange, newCalendarId: string) {
    const affectedDateRanges: TDateRange[] = [newRange];
    let calendarEventId: string | undefined;
    let wasAllDayEvent: boolean = false;

    switch (initialState.eventType) {
        case EEventType.NON_CALENDAR: { // NON_CALENDAR → CALENDAR_ALL_DAY
            const { plannerEvent } = initialState;

            // ✅ 

            // Delete the planner event from storage.
            deletePlannerEventsFromStorageAndCalendar([plannerEvent]);

            break;
        }
        case EEventType.CALENDAR_ALL_DAY: { // CALENDAR_ALL_DAY → CALENDAR_ALL_DAY
            const { calendarEvent } = initialState;

            // ✅ 

            wasAllDayEvent = true;

            // Grab the event's ID from the calendar if it is not moving to a new calendar.
            const canReuseCalendarEventId = await getCanUseCalendarIdElseCleanCalendar(calendarEvent.calendarId, calendarEvent.id, newCalendarId);
            if (canReuseCalendarEventId) calendarEventId = calendarEvent.id;

            // Add the range of the previous event to the calendar update ranges.
            affectedDateRanges.push({
                startIso: calendarEvent.startDate as string,
                endIso: calendarEvent.endDate as string,
            });

            break;
        }
        case EEventType.CALENDAR_MULTI_DAY: { // CALENDAR_MULTI_DAY → CALENDAR_ALL_DAY
            const { startPlannerEvent, endPlannerEvent, calendarEvent } = initialState;

            // ✅ 

            // Grab the event's ID from the calendar if it is not moving to a new calendar.
            const canReuseCalendarEventId = await getCanUseCalendarIdElseCleanCalendar(calendarEvent.calendarId, calendarEvent.id, newCalendarId);
            if (canReuseCalendarEventId) calendarEventId = calendarEvent.id;

            // // Add the range of the previous event to the calendar update ranges.
            affectedDateRanges.push(getCalendarEventTimeRange(calendarEvent));

            // Delete the planner events from storage. 
            if (startPlannerEvent) {
                removeEventIdFromPlannerInStorage(startPlannerEvent.id);
                deletePlannerEventFromStorageById(startPlannerEvent.id);
            }
            if (endPlannerEvent) {
                removeEventIdFromPlannerInStorage(endPlannerEvent.id);
                deletePlannerEventFromStorageById(endPlannerEvent.id);
            }

            break;
        }
        case EEventType.CALENDAR_SINGLE_DAY: { // CALENDAR_SINGLE_DAY → CALENDAR_ALL_DAY
            const { plannerEvent } = initialState;

            // ✅ 

            // Grab the event's ID from the calendar if it is not moving to a new calendar.
            const canReuseCalendarEventId = await getCanUseCalendarIdElseCleanCalendar(plannerEvent.timeConfig?.calendarId, plannerEvent.calendarEventId, newCalendarId);
            if (canReuseCalendarEventId) calendarEventId = plannerEvent.calendarEventId;

            // Add the range of the previous event to the calendar update ranges.
            affectedDateRanges.push(plannerEvent.timeConfig!);

            // Delete the planner event from storage. 
            if (plannerEvent) {
                removeEventIdFromPlannerInStorage(plannerEvent.id);
                deletePlannerEventFromStorageById(plannerEvent.id);
            }

            break;
        }
    }

    return { calendarEventId, wasAllDayEvent, affectedDateRanges };
}

export async function transitionToSingleDayCalendarEvent(initialState: TInitialEventMetadata, newRange: TDateRange, newCalendarId: string) {
    const { startIso } = newRange;

    const affectedDateRanges: TDateRange[] = [newRange];
    let carryoverEventMetadata: TCarryoverEventMetadata | undefined;
    let calendarEventId: string | undefined;
    let wasAllDayEvent = false;

    switch (initialState.eventType) {
        case EEventType.NON_CALENDAR: { // NON_CALENDAR → CALENDAR_SINGLE_DAY
            const { plannerEvent } = initialState;
            const { listId: startDatestamp, id } = plannerEvent;

            // ✅ 

            // If the event is recurring, mark it hidden in its planner so it is not overwritten.
            if (plannerEvent.recurringId) {
                removeRecurringEventFromPlannerInStorage(id);
            }

            // Re-use the position and ID of the existing event.
            const hasMovedPlanners = getHasEventMovedPlanners(startDatestamp, startIso);
            carryoverEventMetadata = getEventMetadataAndCleanPreviousPlanner(id, hasMovedPlanners);

            break;
        }
        case EEventType.CALENDAR_ALL_DAY: { // CALENDAR_ALL_DAY → CALENDAR_SINGLE_DAY
            const { calendarEvent } = initialState;

            // ✅ 

            wasAllDayEvent = true;

            // Grab the event's ID from the calendar if it is not moving to a new calendar.
            const canReuseCalendarEventId = await getCanUseCalendarIdElseCleanCalendar(calendarEvent.calendarId, calendarEvent.id, newCalendarId);
            if (canReuseCalendarEventId) calendarEventId = calendarEvent.id;

            // Mark the previous event ranges to reload the calendar.
            affectedDateRanges.push({
                startIso: calendarEvent.startDate as string,
                endIso: calendarEvent.endDate as string,
            });

            break;
        }
        case EEventType.CALENDAR_MULTI_DAY: { // CALENDAR_MULTI_DAY → CALENDAR_SINGLE_DAY
            const { startPlannerEvent, endPlannerEvent, calendarEvent } = initialState;

            // ✅ 

            // Grab the event's ID from the calendar if it is not moving to a new calendar.
            const canReuseCalendarEventId = await getCanUseCalendarIdElseCleanCalendar(calendarEvent.calendarId, calendarEvent.id, newCalendarId);
            if (canReuseCalendarEventId) calendarEventId = calendarEvent.id;

            // Mark the previous time range of the calendar event to reload the calendar.
            affectedDateRanges.push(getCalendarEventTimeRange(calendarEvent));

            // Delete the end event from storage and remove from its planner.
            if (endPlannerEvent) {
                removeEventIdFromPlannerInStorage(endPlannerEvent.id);
                deletePlannerEventFromStorageById(endPlannerEvent.id);
            }

            // Try to re-use the position and ID of the existing start event.
            if (startPlannerEvent) {
                const hasMovedPlanners = getHasEventMovedPlanners(startPlannerEvent.listId, startIso);
                carryoverEventMetadata = getEventMetadataAndCleanPreviousPlanner(startPlannerEvent.id, hasMovedPlanners);
            }

            break;
        }
        case EEventType.CALENDAR_SINGLE_DAY: { // CALENDAR_SINGLE_DAY → CALENDAR_SINGLE_DAY
            const { plannerEvent } = initialState;
            const { timeConfig, listId: startDatestamp, id } = plannerEvent;

            // ✅ 

            // Grab the event's ID from the calendar if it is not moving to a new calendar.
            const canReuseCalendarEventId = await getCanUseCalendarIdElseCleanCalendar(plannerEvent.timeConfig?.calendarId, plannerEvent.calendarEventId, newCalendarId);
            if (canReuseCalendarEventId) calendarEventId = plannerEvent.calendarEventId;

            // Mark the previous time range to reload the calendar.
            affectedDateRanges.push(timeConfig!);

            // Re-use the position and ID of the existing event.
            const hasMovedPlanners = getHasEventMovedPlanners(startDatestamp, startIso);
            carryoverEventMetadata = getEventMetadataAndCleanPreviousPlanner(id, hasMovedPlanners);

            break;
        }
    }

    return { carryoverEventMetadata, calendarEventId, affectedDateRanges, wasAllDayEvent };
}

export async function transitionToMultiDayCalendarEvent(initialState: TInitialEventMetadata, newRange: TDateRange, newCalendarId: string) {
    const { startIso, endIso } = newRange;

    const affectedDateRanges: TDateRange[] = [newRange];
    const carryoverEventMetadata: TCarryoverEventMap = {};
    let calendarEventId: string | undefined;
    let wasAllDayEvent = false;

    switch (initialState.eventType) {
        case EEventType.NON_CALENDAR: { // NON_CALENDAR → CALENDAR_MULTI_DAY
            const { plannerEvent } = initialState;
            const { listId: startDatestamp, id } = plannerEvent;

            // ✅ 

            // If the event is recurring, mark it hidden in its planner so it is not overwritten.
            if (plannerEvent.recurringId) {
                removeRecurringEventFromPlannerInStorage(id);
            }

            // Re-use the position and ID of the existing event.
            const hasMovedPlanners = getHasEventMovedPlanners(startDatestamp, startIso);
            carryoverEventMetadata[ECarryoverEventType.START_EVENT] = getEventMetadataAndCleanPreviousPlanner(id, hasMovedPlanners);

            break;
        }
        case EEventType.CALENDAR_ALL_DAY: { // CALENDAR_ALL_DAY → CALENDAR_MULTI_DAY
            const { calendarEvent } = initialState;

            // ✅ 

            wasAllDayEvent = true;

            // Grab the event's ID from the calendar if it is not moving to a new calendar.
            const canReuseCalendarEventId = await getCanUseCalendarIdElseCleanCalendar(calendarEvent.calendarId, calendarEvent.id, newCalendarId);
            if (canReuseCalendarEventId) calendarEventId = calendarEvent.id;

            // Mark the previous event ranges to reload the calendar.
            affectedDateRanges.push({
                startIso: calendarEvent.startDate as string,
                endIso: calendarEvent.endDate as string,
            });

            break;
        }
        case EEventType.CALENDAR_MULTI_DAY: { // CALENDAR_MULTI_DAY → CALENDAR_MULTI_DAY
            const { startPlannerEvent, endPlannerEvent, calendarEvent } = initialState;

            // ✅ 

            // Grab the event's ID from the calendar if it is not moving to a new calendar.
            const canReuseCalendarEventId = await getCanUseCalendarIdElseCleanCalendar(calendarEvent.calendarId, calendarEvent.id, newCalendarId);
            if (canReuseCalendarEventId) calendarEventId = calendarEvent.id;

            // Mark the previous time range of the calendar event to reload the calendar.
            affectedDateRanges.push(getCalendarEventTimeRange(calendarEvent));

            // Re-use the position and ID of the existing end event.
            if (endPlannerEvent) {
                const hasEndMovedPlanners = getHasEventMovedPlanners(endPlannerEvent.listId, endIso);
                carryoverEventMetadata[ECarryoverEventType.END_EVENT] = getEventMetadataAndCleanPreviousPlanner(endPlannerEvent.id, hasEndMovedPlanners);
            }

            // Re-use the position and ID of the existing start event.
            if (startPlannerEvent) {
                const hasStartMovedPlanners = getHasEventMovedPlanners(startPlannerEvent.listId, startIso);
                carryoverEventMetadata[ECarryoverEventType.START_EVENT] = getEventMetadataAndCleanPreviousPlanner(startPlannerEvent.id, hasStartMovedPlanners);
            }

            break;
        }
        case EEventType.CALENDAR_SINGLE_DAY: { // CALENDAR_SINGLE_DAY → CALENDAR_MULTI_DAY
            const { plannerEvent } = initialState;
            const { listId: startDatestamp, timeConfig, id } = plannerEvent;

            // ✅ 

            // Grab the event's ID from the calendar if it is not moving to a new calendar.
            const canReuseCalendarEventId = await getCanUseCalendarIdElseCleanCalendar(plannerEvent.timeConfig?.calendarId, plannerEvent.calendarEventId, newCalendarId);
            if (canReuseCalendarEventId) calendarEventId = plannerEvent.calendarEventId;

            // Mark the previous time range of the calendar event to reload the calendar.
            affectedDateRanges.push(timeConfig!);

            // Re-use the position and ID of the existing event.
            const hasMovedPlanners = getHasEventMovedPlanners(startDatestamp, startIso);
            carryoverEventMetadata[ECarryoverEventType.START_EVENT] = getEventMetadataAndCleanPreviousPlanner(id, hasMovedPlanners);

            break;
        }
    }

    return { carryoverEventMetadata, calendarEventId, affectedDateRanges, wasAllDayEvent };
}

export async function transitionToNonCalendarEvent(initialState: TInitialEventMetadata, newRange: TDateRange) {
    const { startIso } = newRange;

    const affectedDateRanges: TDateRange[] = [];
    let carryoverEventMetadata: TCarryoverEventMetadata | undefined;

    switch (initialState.eventType) {
        case EEventType.NON_CALENDAR: { // NON_CALENDAR → NON_CALENDAR
            const { plannerEvent } = initialState;
            const { listId: startDatestamp, id } = plannerEvent;

            // ✅ 

            // If the event is recurring, mark it hidden in its planner so it is not overwritten.
            if (plannerEvent.recurringId) {
                removeRecurringEventFromPlannerInStorage(id);
            }

            // Re-use the position and ID of the existing event.
            const hasMovedPlanners = getHasEventMovedPlanners(startDatestamp, startIso);
            carryoverEventMetadata = getEventMetadataAndCleanPreviousPlanner(id, hasMovedPlanners);

            break;
        }
        case EEventType.CALENDAR_ALL_DAY: { // CALENDAR_ALL_DAY → NON_CALENDAR
            const { calendarEvent } = initialState;

            // ✅ 

            // Delete the existing event in the calendar.
            await Calendar.deleteEventAsync(calendarEvent.id, { futureEvents: true });

            // Mark the range of the calendar event to reload the calendar data.
            affectedDateRanges.push({
                startIso: calendarEvent.startDate as string,
                endIso: calendarEvent.endDate as string,
            });

            break;
        }
        case EEventType.CALENDAR_MULTI_DAY: { // CALENDAR_MULTI_DAY → NON_CALENDAR
            const { startPlannerEvent, endPlannerEvent, calendarEvent } = initialState;

            // ✅ 

            // Delete the event in the calendar.
            await Calendar.deleteEventAsync(calendarEvent.id, { futureEvents: true });

            // Mark the range of the calendar event to reload the calendar data.
            affectedDateRanges.push(getCalendarEventTimeRange(calendarEvent));

            // Delete the end event from storage and remove from its planner.
            if (endPlannerEvent) {
                removeEventIdFromPlannerInStorage(endPlannerEvent.id);
                deletePlannerEventFromStorageById(endPlannerEvent.id);
            }

            // Try to carryover the start event's ID and index to reuse with the new event.
            if (startPlannerEvent) {
                const hasMovedPlanners = getHasEventMovedPlanners(startPlannerEvent.listId, startIso);
                carryoverEventMetadata = getEventMetadataAndCleanPreviousPlanner(startPlannerEvent.id, hasMovedPlanners);
            }

            break;
        }
        case EEventType.CALENDAR_SINGLE_DAY: { // CALENDAR_SINGLE_DAY → NON_CALENDAR
            const { plannerEvent } = initialState;
            const { timeConfig, id, listId: startDatestamp, calendarEventId } = plannerEvent;

            // ✅ 

            // Event was in calendar. Delete it.
            await Calendar.deleteEventAsync(calendarEventId!, { futureEvents: true });

            // Mark the range of the calendar event to reload the calendar data.
            affectedDateRanges.push(timeConfig!);

            // Carryover the event's ID and index to reuse with the new event.
            const hasMovedPlanners = getHasEventMovedPlanners(startDatestamp, startIso);
            carryoverEventMetadata = getEventMetadataAndCleanPreviousPlanner(id, hasMovedPlanners);

            break;
        }
    }

    return { affectedDateRanges, carryoverEventMetadata };
}