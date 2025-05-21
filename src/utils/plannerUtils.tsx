import Toolbar, { ToolbarProps } from '@/components/sortedList/ListItemToolbar';
import TimeValue from '@/components/text/TimeValue';
import { EItemStatus } from '@/enums/EItemStatus';
import { deleteEvents, getCarryoverEventsAndCleanStorage, saveEvent, savePlannerToStorage } from '@/storage/plannerStorage';
import { getRecurringPlannerFromStorage } from '@/storage/recurringEventStorage';
import { ModifyItemConfig } from '@/types/listItems/core/rowConfigTypes';
import { IPlannerEvent, TTimeConfig } from '@/types/listItems/IPlannerEvent';
import { IRecurringEvent } from '@/types/listItems/IRecurringEvent';
import { TPlanner } from '@/types/planner/TPlanner';
import { uuid } from 'expo-modules-core';
import { datestampToDayOfWeek, extractTimeValue, getEventTime, getTodayDatestamp, isTimeEarlierOrEqual, timeValueToIso } from './dateUtils';
import { generateSortId, isItemTextfield, sanitizeListForScan } from './listUtils';

// ------------- Storage Getters and Setters -------------

export function getEventsFromPlanner(
    planner: TPlanner,
): IPlannerEvent[] {
    return planner.events;
}

export function setEventsInPlanner(
    events: IPlannerEvent[],
    planner: TPlanner,
) {
    return { planner, events };
}

// ------------- Modal Utilities -------------

/**
 * Toggles the time modal for a planner event
 * @param planEvent - The planner event to toggle
 * @param toggleItemEdit - Function to toggle item edit
 * @param setTimeModalOpen - Function to set the time modal open state
 */
export async function openTimeModal(
    planEvent: IPlannerEvent,
    toggleItemEdit: (event: IPlannerEvent) => Promise<void>,
    openTimeModal: (item: IPlannerEvent, saveItem: (item: IPlannerEvent) => Promise<void>) => void,
    currentList: IPlannerEvent[],
    saveTextfieldAndCreateNew: (item: IPlannerEvent, referenceId?: number, isChildId?: boolean) => void
) {
    if (!isItemTextfield(planEvent)) {
        await toggleItemEdit(planEvent);
    }
    openTimeModal(planEvent, (newEvent) => handleTimeModalSave(newEvent, currentList, saveTextfieldAndCreateNew));
}

/**
 * Updates the current textfield with the new data entered in the time modal.
 * The item may be shifted in the list to maintain sorted time logic.
 * @param updatedEvent - New item to save
 * @param currentList - The current list of items
 * @param setCurrentTextfield - Function to save the current textfield
 */
async function handleTimeModalSave(
    updatedEvent: IPlannerEvent,
    currentList: IPlannerEvent[],
    saveTextfieldAndCreateNew: (item: IPlannerEvent, referenceId?: number, isChildId?: boolean) => void
) {
    updatedEvent.sortId = generateSortIdByTime(updatedEvent, currentList);
    saveTextfieldAndCreateNew(updatedEvent, updatedEvent.sortId);
}

// ------------- List Modification Handlers -------------

/**
 * ✅ Handles saving a planner event. If the item was or is a calendar event, 
 * the calendar data will be refreshed.
 * 
 * @param updatedPlanEvent - The planner event to save
 * @param reloadChips - Function to reload chips
 * @param items - The current list items
 * @returns The new ID of the event after saving.
 */
export async function saveEventLoadChips(
    updatedPlanEvent: IPlannerEvent,
    reloadChips: () => Promise<void>,
    items: IPlannerEvent[]
) {
    const eventCalendarId = await saveEvent(updatedPlanEvent);

    if (
        updatedPlanEvent.calendarId ||
        items.find(i => i.id === updatedPlanEvent.id)?.calendarId
    ) {
        await reloadChips();
    }

    return eventCalendarId;
}

/**
 * ✅ Handles deleting a planner event. If any items were a calendar event, 
 * the calendar data will be refreshed.
 * 
 * @param planEvents - The planner events to delete
 * @param reloadChips - Function to reload chips
 */
export async function deleteEventsLoadChips(
    planEvents: IPlannerEvent[],
    reloadChips: () => Promise<void>
) {
    await deleteEvents(planEvents);
    if (planEvents.some(item => item.calendarId)) await reloadChips();
}

// ------------- Planner Generation -------------

/**
 * ✅ Build a planner out of existing data, the calendar, recurring events, 
 * and carryover events from past planners.
 * 
 * @param datestamp - the date the planner represents
 * @param storagePlanner - current planner in storage
 * @param calendarEvents - events in the device calendar
 * @returns - a newly build planner, synced up with storage
 */
export async function buildPlannerEvents(
    datestamp: string,
    storagePlanner: TPlanner,
    calendarEvents: IPlannerEvent[]
): Promise<IPlannerEvent[]> {
    const planner = { ...storagePlanner };

    // Phase 1: Merge in any recurring events for the given weekday.
    const recurringPlanner = getRecurringPlannerFromStorage(datestampToDayOfWeek(datestamp));
    planner.events = syncPlannerWithRecurring(recurringPlanner, planner.events, datestamp);

    // Phase 2: Merge in any events from the calendar.
    planner.events = syncPlannerWithCalendar(calendarEvents, planner.events, datestamp);

    // Phase 3: Merge in carryover events from yesterday. Only applicable for today.
    if (datestamp === getTodayDatestamp()) {
        const remainingYesterdayEvents = getCarryoverEventsAndCleanStorage();
        remainingYesterdayEvents.reverse().forEach(yesterdayEvent => {
            const newEvent = {
                ...yesterdayEvent,
                listId: datestamp,
                sortId: -1,
            };

            planner.events.push(newEvent);
            newEvent.sortId = generateSortId(-1, planner.events);
        });
    }

    // Phase 4: Save the planner to storage if any events were added or removed during build.
    if (
        // The planner gained new events
        planner.events.some(planEvent =>
            !storagePlanner.events.some(existingEvent => existingEvent.id === planEvent.id)
        ) ||
        // The planner lost existing events
        storagePlanner.events.some(existingEvent =>
            !planner.events.some(planEvent => planEvent.id === existingEvent.id)
        )
    ) savePlannerToStorage(datestamp, planner);

    return planner.events;
}

/**
 * ✅ Syncs a planner with a calendar. Calendars have final say on the state of the events.
 * 
 * @param calendar - the calendar events to sync with
 * @param plannerEvents - the planner being updated
 * @param datestamp - the date the planner represents
 * @returns - the new planner synced with the calendar
 */
export function syncPlannerWithCalendar(
    calendar: IPlannerEvent[],
    plannerEvents: IPlannerEvent[],
    datestamp: string
) {
    // console.info('syncPlannerWithCalendar: START', { calendar, planner, timestamp });

    // Phase 1: Remove any calendar events that no longer exist from the planner.
    // All existing calendar events will also be updated to reflect the calendar data.
    const newPlanner = plannerEvents.reduce<IPlannerEvent[]>((accumulator, planEvent) => {

        // This event isn't related to the calendar. Keep it.
        if (
            !planEvent.calendarId ||
            planEvent.status === EItemStatus.HIDDEN
        ) return [...accumulator, planEvent];

        const calEvent = calendar.find(calEvent => calEvent.id === planEvent.calendarId);
        if (calEvent) {
            // This event still exists. Sync the data with the calendar.
            const updatedEvent = {
                ...planEvent,
                timeConfig: calEvent.timeConfig,
                value: calEvent.value,
            }

            const updatedPlanner = [...accumulator, updatedEvent];
            updatedEvent.sortId = generateSortIdByTime(updatedEvent, updatedPlanner);
            return updatedPlanner;
        } else {
            // This event was deleted. Remove it from the planner.
            return accumulator;
        }
    }, []);

    // Add any new calendar events to the planner.
    calendar.forEach(calEvent => {
        if (!newPlanner.find(planEvent => planEvent.calendarId === calEvent.id)) {
            const newEvent = {
                ...calEvent,
                listId: datestamp,
                calendarId: calEvent.id
            };
            newPlanner.push(newEvent);
            newEvent.sortId = generateSortIdByTime(newEvent, newPlanner);
        }
    });

    // console.info('syncPlannerWithCalendar: END', newPlanner);
    return newPlanner;
}

// TODO: wherever editing events is, change it so that changing a recurring event will just
// HIDE that event and create a new clone of it with the updated data -> then no need to 
// precedence the planner event time configs

/**
 * ✅ Syncs a planner with a recurring planner. 
 * Planner events have final say on timing. Recurring events have final say on value.
 * 
 * @param recurringPlanner - the events to sync within the planner
 * @param plannerEvents - the planner being updated
 * @param datsetamp - the date the planner represents
 * @returns - the new planner synced with the recurring events
 */
export function syncPlannerWithRecurring(
    recurringPlanner: IRecurringEvent[],
    plannerEvents: IPlannerEvent[],
    datsetamp: string
) {
    // console.info('syncPlannerWithRecurring: START', { recurringPlanner, planner, timestamp })

    function getRecurringEventTimeConfig(recEvent: IRecurringEvent): TTimeConfig {
        return {
            startTime: timeValueToIso(datsetamp, recEvent.startTime!),
            endTime: timeValueToIso(datsetamp, '23:55'),
            allDay: false,
        }
    };

    // Phase 1: Build the new planner out of the recurring planner.
    // Existing planner events have highest priority for the timeConfig.
    // Recurring events have highest priority for the value.
    const newPlanner = recurringPlanner.reduce<IRecurringEvent[]>((accumulator, recEvent) => {
        const planEvent = plannerEvents.find(planEvent => planEvent.recurringId === recEvent.id);

        // The planner event has been deleted. Keep it hidden.
        if (planEvent?.status === EItemStatus.HIDDEN) {
            return [...accumulator, planEvent];
        }

        if (planEvent) {
            // This recurring event is in the planner. Sync the data.
            const updatedEvent: IPlannerEvent = {
                id: planEvent.id,
                status: planEvent.status,
                sortId: planEvent.sortId,
                value: recEvent.value,
                listId: datsetamp,
                recurringId: recEvent.id,
            };

            // Sync event time.
            if (planEvent.timeConfig) {
                updatedEvent.timeConfig = planEvent.timeConfig;
            } else if (recEvent.startTime) {
                updatedEvent.timeConfig = getRecurringEventTimeConfig(recEvent);
            }

            // Sync calendar link.
            if (planEvent.calendarId) {
                updatedEvent.calendarId = planEvent.calendarId;
            }

            const updatedPlanner = [...accumulator, updatedEvent];
            updatedEvent.sortId = generateSortIdByTime(updatedEvent, updatedPlanner);
            return updatedPlanner;
        } else {
            // This recurring event hasn't been added to the planner yet. Add it.
            const newEvent: IPlannerEvent = {
                id: uuid.v4(),
                listId: datsetamp,
                recurringId: recEvent.id,
                value: recEvent.value,
                sortId: recEvent.sortId,
                status: recEvent.status
            };

            // Add event time.
            if (recEvent.startTime) {
                newEvent.timeConfig = getRecurringEventTimeConfig(recEvent);
            }

            const updatedPlanner = [...accumulator, newEvent];
            newEvent.sortId = generateSortIdByTime(newEvent, updatedPlanner);
            return updatedPlanner;
        }
    }, []);

    // Phase 2: Add all non-recurring events back into the planner.
    plannerEvents.forEach(existingPlanEvent => {
        if (!newPlanner.find(planEvent => planEvent.id === existingPlanEvent.id)) {
            newPlanner.push(existingPlanEvent);
            existingPlanEvent.sortId = generateSortIdByTime(existingPlanEvent, newPlanner);
        }
    });

    // console.info('syncPlannerWithRecurring: END', newPlanner);
    return newPlanner;
}

// ------------- Common Props -------------

/**
 * @handleValueChange Prop: extracts any typed time value and uses it to mark the event's start time.
 * The time value will be removed from the event @value and placed in the @timeConfig instead.
 * Recurring events and Planner events can both be handled.
 * 
 * When param @datestamp is received, the item is a Planner Event. Otherwise it is a Recurring Event.
 */
export function handleEventInput(
    text: string,
    item: IPlannerEvent | IRecurringEvent,
    currentList: (IPlannerEvent | IRecurringEvent)[],
    datestamp?: string,
): IPlannerEvent | IRecurringEvent {
    const itemTime = getEventTime(item);
    if (!itemTime) {
        const { timeConfig, updatedText } = extractTimeValue(text, datestamp);
        if (timeConfig) {
            const newEvent = { ...item, value: updatedText };
            if (datestamp) {
                (newEvent as IRecurringEvent).startTime = timeConfig.startTime;
            } else {
                (newEvent as IPlannerEvent).timeConfig = timeConfig;
            }
            newEvent.sortId = generateSortIdByTime(newEvent, currentList);
            return newEvent;
        }
    }
    return { ...item, value: text };
}

/**
 * @onDragEnd Prop: enforces accurate list sorting for any timed events.
 * If the dragged item has a time specified, its new position will check it doesn't break time logic.
 * If time logic is broken, the drag will be canceled.
 */
export async function handleDragEnd(
    item: IPlannerEvent | IRecurringEvent,
    currentList: (IPlannerEvent | IRecurringEvent)[],
    refetchItems: () => void,
    saveItem: (item: IPlannerEvent | IRecurringEvent) => Promise<void | string>
) {
    const itemTime = getEventTime(item);
    if (itemTime) {
        const currentItemIndex = currentList.findIndex(listItem => listItem.id === item.id);
        if (currentItemIndex === -1) {

            const initialSortId = currentList[currentItemIndex].sortId;
            const newSortId = generateSortIdByTime(item, currentList);
            if (newSortId === initialSortId) {
                // The item has a time conflict or has not moved. Undo Drag.
                refetchItems();
                return;
            }

            item.sortId = newSortId;
        }
    }
    await saveItem(item);
}

/**
 * @getLeftIcon Prop: generates the config for the event time modal trigger icon.
 */
export function generateTimeIconConfig(
    event: IPlannerEvent | IRecurringEvent,
    openTimeModal: (item: IPlannerEvent | IRecurringEvent) => void
) {
    const itemTime = getEventTime(event);
    return {
        hideIcon: !itemTime,
        onClick: () => openTimeModal(event),
        customIcon: (
            <TimeValue
                allDay={!!(event as IPlannerEvent).timeConfig?.allDay}
                endEvent={!!(event as IPlannerEvent).timeConfig?.multiDayEnd}
                startEvent={!!(event as IPlannerEvent).timeConfig?.multiDayStart}
                timeValue={itemTime}
                isoTimestamp={itemTime}
                concise
            />
        )
    }
}

/**
 * @getToolbar Prop: generates the config for the planner event toolbar.
 * The toolbar allows for opening the time modal.
 */
export function generateEventToolbar(
    event: IPlannerEvent | IRecurringEvent,
    openTimeModal: (event: IPlannerEvent) => void,
    timeModalOpen: boolean
): ModifyItemConfig<IPlannerEvent | IRecurringEvent, ToolbarProps<IPlannerEvent | IRecurringEvent>> {
    return {
        component: Toolbar,
        props: {
            item: event,
            open: !timeModalOpen && isItemTextfield(event),
            iconSets: [[{
                type: 'clock',
                onClick: () => openTimeModal(event),
            }]]
        }
    }
}

// ------------- Sort ID Handling -------------

/**
 * ✅ Generate a new sort ID for the event that maintains time logic within the planner.
 * @param event - the event to place
 * @param planner - the planner
 * @returns - the new sort ID for the event
 */
export function generateSortIdByTime(
    event: IPlannerEvent | IRecurringEvent,
    events: (IPlannerEvent | IRecurringEvent)[]
): number {
    // console.info('generateSortIdByTime START', { event: {...event}, planner: [...planner] });
    const planner = sanitizeListForScan(events, event);
    const plannerWithoutEvent = planner.filter(curr => curr.id !== event.id);
    const eventTime = getEventTime(event);

    // Handler for situations where the item can remain in its position.
    function persistEventPosition() {
        if (event.sortId === -1) {
            // Event will be at the top of the list
            return generateSortId(-1, plannerWithoutEvent);
        } else if (plannerWithoutEvent.find(item => item.sortId === event.sortId)) {
            // Event has a conflicting sort ID. Place this item above the conflict.
            return generateSortId(event.sortId, plannerWithoutEvent, true);
        } else {
            // Keep the event's current position.
            return event.sortId;
        }
    };

    // Pre-Check 1: The event is unscheduled. Keep it at its current position.
    if (!eventTime || event.status === EItemStatus.HIDDEN) return persistEventPosition();

    // Pre-Check 2: Check if the event conflicts at its current position.
    const timedPlanner = [...planner].filter(existingEvent => getEventTime(existingEvent));
    const currentIndex = timedPlanner.findIndex(e => e.id === event.id);

    const earlierEvent = timedPlanner[currentIndex - 1];
    const laterEvent = timedPlanner[currentIndex + 1];
    const earlierTime = getEventTime(earlierEvent);
    const laterTime = getEventTime(laterEvent);
    if (
        isTimeEarlierOrEqual(earlierTime!, eventTime) &&
        isTimeEarlierOrEqual(eventTime, laterTime!)
    ) return persistEventPosition();

    // Scenario 1: Place the event before the first event that starts after or during it.
    const laterEventIndex = planner.findIndex(existingEvent => {
        const existingTime = getEventTime(existingEvent);
        if (!existingTime || existingEvent.id === event.id) return false;

        return isTimeEarlierOrEqual(eventTime, existingTime);
    });
    if (laterEventIndex !== -1) {
        const newChildSortId = planner[laterEventIndex].sortId;
        return generateSortId(newChildSortId, plannerWithoutEvent, true);
    }

    // Scenario 2: Place the event after the last event that starts before or during it.
    const earlierEventIndex = planner.findLastIndex(existingEvent => {
        const existingTime = getEventTime(existingEvent);
        if (!existingTime || existingEvent.id === event.id) return false;

        return isTimeEarlierOrEqual(existingTime, eventTime);
    });
    if (earlierEventIndex !== -1) {
        const newParentSortId = planner[earlierEventIndex].sortId;
        return generateSortId(newParentSortId, plannerWithoutEvent);
    }

    throw new Error('generateSortIdByTime: An error occurred during timed sort ID generation.');
};