import { ECarryoverEventType, EEventType } from "@/lib/enums/plannerEventModalEnums";
import { TCarryoverEventMetadata, TInitialEventMetadata } from "@/lib/types/form/plannerEventMetadata";
import { IPlannerEvent, TDateRange } from "@/lib/types/listItems/IPlannerEvent";
import { TPlanner } from "@/lib/types/planner/TPlanner";
import { deletePlannerEventFromStorageById, savePlannerToStorage } from "@/storage/plannerStorage";
import * as Calendar from "expo-calendar";
import { isoToDatestamp } from "./dateUtils";
import { deletePlannerEventsFromStorageAndCalendar } from "./plannerUtils";

// ✅ 

type TCarryoverEventMap = Partial<Record<ECarryoverEventType, TCarryoverEventMetadata>>;

// ==================
//  Helper Functions
// ==================

// ---- Carryover Getters ----

async function getCarryoverCalendarEventIdByCalendarEvent(
    previousCalendarEvent: Calendar.Event | undefined,
    newCalendarId: string
): Promise<string | undefined> {
    if (!previousCalendarEvent) return;

    const canReuse = await getCanReuseCalendarEventIdElseDeleteEventFromCalendar(
        previousCalendarEvent.calendarId,
        previousCalendarEvent.id,
        newCalendarId
    );

    return canReuse ? previousCalendarEvent.id : undefined;
}

async function getCarryoverCalendarEventIdByPlannerEvent(
    previousPlannerEvent: IPlannerEvent | undefined,
    newCalendarId: string
): Promise<string | undefined> {
    if (!previousPlannerEvent || !previousPlannerEvent.timeConfig) return;

    const canReuse = await getCanReuseCalendarEventIdElseDeleteEventFromCalendar(
        previousPlannerEvent.timeConfig.calendarId,
        previousPlannerEvent.calendarEventId,
        newCalendarId
    );

    return canReuse ? previousPlannerEvent.calendarEventId : undefined;
}

function getCarryoverEventMetadata(
    targetIso: string,
    plannerEvent: IPlannerEvent | null,
    planner: TPlanner | null
): TCarryoverEventMetadata | undefined {
    if (!plannerEvent || !planner) return;

    const hasMovedPlanners = getHasEventMovedPlanners(plannerEvent.listId, targetIso);
    return getEventMetadataAndRemoveStaleEventFromPlanner(plannerEvent, planner, hasMovedPlanners);
}

// ---- Getters ----

function getEventMetadataAndRemoveStaleEventFromPlanner(
    plannerEvent: IPlannerEvent,
    planner: TPlanner,
    removeFromPlanner: boolean
): TCarryoverEventMetadata {
    if (removeFromPlanner) removeEventFromPlannerInStorage(plannerEvent, planner);

    return {
        id: plannerEvent.id,
        index: removeFromPlanner ? null : getPlannerEventIndex(plannerEvent, planner)
    }
}

function getHasEventMovedPlanners(prevDatestamp: string, newIso: string): boolean {
    return prevDatestamp !== isoToDatestamp(newIso);
}

function getPlannerEventIndex(plannerEvent: IPlannerEvent, planner: TPlanner): number {
    return planner.eventIds.findIndex((id) => id === plannerEvent.id);
}

async function getCanReuseCalendarEventIdElseDeleteEventFromCalendar(
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

export function getCalendarEventTimeRange(event: Calendar.Event) {
    return {
        startIso: event.startDate as string,
        endIso: event.endDate as string
    }
}

// ---- Deleters / Hiders ----

function hideRecurringEventForPlannerInStorage(plannerEvent: IPlannerEvent, planner: TPlanner) {
    if (!plannerEvent.recurringId) return;

    savePlannerToStorage({
        ...planner,
        deletedRecurringEventIds: [...planner.deletedRecurringEventIds, plannerEvent.recurringId]
    });
}

function removeEventFromPlannerInStorage(plannerEvent: IPlannerEvent, planner: TPlanner) {
    savePlannerToStorage({
        ...planner,
        eventIds: planner.eventIds.filter((id) => id !== plannerEvent.id)
    });
}

function hardDeleteEventFromStorage(plannerEvent: IPlannerEvent | null, planner: TPlanner | null) {
    if (!plannerEvent || !planner) return;

    removeEventFromPlannerInStorage(plannerEvent, planner);
    deletePlannerEventFromStorageById(plannerEvent.id);
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

            // Delete the planner event from storage.
            deletePlannerEventsFromStorageAndCalendar([plannerEvent]);

            break;
        }
        case EEventType.CALENDAR_ALL_DAY: { // CALENDAR_ALL_DAY → CALENDAR_ALL_DAY
            const { calendarEvent } = initialState;

            // Grab the event's ID from the calendar if it is not moving to a new calendar.
            calendarEventId = await getCarryoverCalendarEventIdByCalendarEvent(calendarEvent, newCalendarId);
            wasAllDayEvent = true;

            // Add the range of the previous event to the calendar update ranges.
            affectedDateRanges.push(getCalendarEventTimeRange(calendarEvent));

            break;
        }
        case EEventType.CALENDAR_MULTI_DAY: { // CALENDAR_MULTI_DAY → CALENDAR_ALL_DAY
            const { startPlannerEvent, endPlannerEvent, startPlanner, endPlanner, calendarEvent } = initialState;

            // Grab the event's ID from the calendar if it is not moving to a new calendar.
            calendarEventId = await getCarryoverCalendarEventIdByCalendarEvent(calendarEvent, newCalendarId);

            // // Add the range of the previous event to the calendar update ranges.
            affectedDateRanges.push(getCalendarEventTimeRange(calendarEvent));

            // Delete the planner events from storage. 
            hardDeleteEventFromStorage(startPlannerEvent, startPlanner);
            hardDeleteEventFromStorage(endPlannerEvent, endPlanner);

            break;
        }
        case EEventType.CALENDAR_SINGLE_DAY: { // CALENDAR_SINGLE_DAY → CALENDAR_ALL_DAY
            const { plannerEvent, planner } = initialState;
            const { timeConfig } = plannerEvent;

            // Grab the event's ID from the calendar if it is not moving to a new calendar.
            calendarEventId = await getCarryoverCalendarEventIdByPlannerEvent(plannerEvent, newCalendarId);

            // Add the range of the previous event to the calendar update ranges.
            affectedDateRanges.push(timeConfig!);

            // Delete the planner event from storage. 
            hardDeleteEventFromStorage(plannerEvent, planner);

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
            const { plannerEvent, planner } = initialState;

            // If the event is recurring, mark it hidden in its planner so it is not overwritten.
            hideRecurringEventForPlannerInStorage(plannerEvent, planner);

            // Re-use the position and ID of the existing event.
            carryoverEventMetadata = getCarryoverEventMetadata(startIso, plannerEvent, planner);

            break;
        }
        case EEventType.CALENDAR_ALL_DAY: { // CALENDAR_ALL_DAY → CALENDAR_SINGLE_DAY
            const { calendarEvent } = initialState;

            // Grab the event's ID from the calendar if it is not moving to a new calendar.
            calendarEventId = await getCarryoverCalendarEventIdByCalendarEvent(calendarEvent, newCalendarId);
            wasAllDayEvent = true;

            // Mark the previous event ranges to reload the calendar.
            affectedDateRanges.push(getCalendarEventTimeRange(calendarEvent));

            break;
        }
        case EEventType.CALENDAR_MULTI_DAY: { // CALENDAR_MULTI_DAY → CALENDAR_SINGLE_DAY
            const { startPlannerEvent, endPlannerEvent, startPlanner, endPlanner, calendarEvent } = initialState;

            // Grab the event's ID from the calendar if it is not moving to a new calendar.
            calendarEventId = await getCarryoverCalendarEventIdByCalendarEvent(calendarEvent, newCalendarId);

            // Mark the previous time range of the calendar event to reload the calendar.
            affectedDateRanges.push(getCalendarEventTimeRange(calendarEvent));

            // Delete the end event from storage and remove from its planner.
            hardDeleteEventFromStorage(endPlannerEvent, endPlanner);

            // Try to re-use the position and ID of the existing start event.
            carryoverEventMetadata = getCarryoverEventMetadata(startIso, startPlannerEvent, startPlanner);

            break;
        }
        case EEventType.CALENDAR_SINGLE_DAY: { // CALENDAR_SINGLE_DAY → CALENDAR_SINGLE_DAY
            const { plannerEvent, planner } = initialState;
            const { timeConfig } = plannerEvent;

            // Grab the event's ID from the calendar if it is not moving to a new calendar.
            calendarEventId = await getCarryoverCalendarEventIdByPlannerEvent(plannerEvent, newCalendarId);

            // Mark the previous time range to reload the calendar.
            affectedDateRanges.push(timeConfig!);

            // Re-use the position and ID of the existing event.
            carryoverEventMetadata = getCarryoverEventMetadata(startIso, plannerEvent, planner);

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
            const { plannerEvent, planner } = initialState;

            // If the event is recurring, mark it hidden in its planner so it is not overwritten.
            hideRecurringEventForPlannerInStorage(plannerEvent, planner);

            // Re-use the position and ID of the existing event.
            carryoverEventMetadata[ECarryoverEventType.START_EVENT] = getCarryoverEventMetadata(startIso, plannerEvent, planner);

            break;
        }
        case EEventType.CALENDAR_ALL_DAY: { // CALENDAR_ALL_DAY → CALENDAR_MULTI_DAY
            const { calendarEvent } = initialState;

            // Grab the event's ID from the calendar if it is not moving to a new calendar.
            calendarEventId = await getCarryoverCalendarEventIdByCalendarEvent(calendarEvent, newCalendarId);
            wasAllDayEvent = true;

            // Mark the previous event ranges to reload the calendar.
            affectedDateRanges.push(getCalendarEventTimeRange(calendarEvent));

            break;
        }
        case EEventType.CALENDAR_MULTI_DAY: { // CALENDAR_MULTI_DAY → CALENDAR_MULTI_DAY
            const { startPlannerEvent, endPlannerEvent, startPlanner, endPlanner, calendarEvent } = initialState;

            // Grab the event's ID from the calendar if it is not moving to a new calendar.
            calendarEventId = await getCarryoverCalendarEventIdByCalendarEvent(calendarEvent, newCalendarId);

            // Mark the previous time range of the calendar event to reload the calendar.
            affectedDateRanges.push(getCalendarEventTimeRange(calendarEvent));

            // Re-use the position and ID of the existing end event.
            carryoverEventMetadata[ECarryoverEventType.END_EVENT] = getCarryoverEventMetadata(endIso, endPlannerEvent, endPlanner);

            // Re-use the position and ID of the existing start event.
            carryoverEventMetadata[ECarryoverEventType.START_EVENT] = getCarryoverEventMetadata(startIso, startPlannerEvent, startPlanner);

            break;
        }
        case EEventType.CALENDAR_SINGLE_DAY: { // CALENDAR_SINGLE_DAY → CALENDAR_MULTI_DAY
            const { plannerEvent, planner } = initialState;
            const { timeConfig } = plannerEvent;

            // Grab the event's ID from the calendar if it is not moving to a new calendar.
            calendarEventId = await getCarryoverCalendarEventIdByPlannerEvent(plannerEvent, newCalendarId);

            // Mark the previous time range of the calendar event to reload the calendar.
            affectedDateRanges.push(timeConfig!);

            // Re-use the position and ID of the existing event.
            carryoverEventMetadata[ECarryoverEventType.START_EVENT] = getCarryoverEventMetadata(startIso, plannerEvent, planner);

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
            const { plannerEvent, planner } = initialState;

            // If the event is recurring, mark it hidden in its planner so it is not overwritten.
            hideRecurringEventForPlannerInStorage(plannerEvent, planner);

            // Re-use the position and ID of the existing event.
            carryoverEventMetadata = getCarryoverEventMetadata(startIso, plannerEvent, planner);

            break;
        }
        case EEventType.CALENDAR_ALL_DAY: { // CALENDAR_ALL_DAY → NON_CALENDAR
            const { calendarEvent } = initialState;

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
            const { startPlannerEvent, endPlannerEvent, startPlanner, endPlanner, calendarEvent } = initialState;

            // Delete the event in the calendar.
            await Calendar.deleteEventAsync(calendarEvent.id, { futureEvents: true });

            // Mark the range of the calendar event to reload the calendar data.
            affectedDateRanges.push(getCalendarEventTimeRange(calendarEvent));

            // Delete the end event from storage and remove from its planner.
            hardDeleteEventFromStorage(endPlannerEvent, endPlanner);

            // Try to carryover the start event's ID and index to reuse with the new event.
            carryoverEventMetadata = getCarryoverEventMetadata(startIso, startPlannerEvent, startPlanner);

            break;
        }
        case EEventType.CALENDAR_SINGLE_DAY: { // CALENDAR_SINGLE_DAY → NON_CALENDAR
            const { plannerEvent, planner } = initialState;
            const { timeConfig, calendarEventId } = plannerEvent;

            // Event was in calendar. Delete it.
            await Calendar.deleteEventAsync(calendarEventId!, { futureEvents: true });

            // Mark the range of the calendar event to reload the calendar data.
            affectedDateRanges.push(timeConfig!);

            // Re-use the position and ID of the existing event.
            carryoverEventMetadata = getCarryoverEventMetadata(startIso, plannerEvent, planner);

            break;
        }
    }

    return { affectedDateRanges, carryoverEventMetadata };
}