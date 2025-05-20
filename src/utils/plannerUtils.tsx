import { saveEvent, deleteEvents, getCarryoverEventsAndCleanStorage, savePlannerToStorage } from '@/storage/plannerStorage';
import { generateSortId, isItemTextfield } from './listUtils';
import { datestampToDayOfWeek, extractTimeValue, generateSortIdByTime, getEventTime, getTodayDatestamp, timeValueToIso } from './dateUtils';
import { IPlannerEvent } from '@/types/listItems/IPlannerEvent';
import { TPlanner } from '@/types/planner/TPlanner';
import { getRecurringPlannerFromStorage } from '@/storage/recurringEventStorage';
import { uuid } from 'expo-modules-core';
import { EItemStatus } from '@/enums/EItemStatus';
import { IRecurringEvent } from '@/types/listItems/IRecurringEvent';
import TimeValue from '@/components/text/TimeValue';
import { ModifyItemConfig } from '@/types/listItems/core/rowConfigTypes';
import Toolbar, { ToolbarProps } from '@/components/sortedList/ListItemToolbar';

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

/**
 * Handles saving a planner event
 * @param planEvent - The planner event to save
 * @param reloadChips - Function to reload chips
 * @param items - The current list items
 */
export async function saveEventLoadChips(
    planEvent: IPlannerEvent,
    reloadChips: () => Promise<void>,
    items: IPlannerEvent[]
) {
    const eventCalendarId = await saveEvent(planEvent);
    if (planEvent.calendarId || (items.find(i => i.id === planEvent.id)?.calendarId)) {
        await reloadChips();
    }
    return eventCalendarId;
}

/**
 * Handles deleting a planner event.
 * @param planEvent - The planner event to delete
 * @param deleteEvent - Function to delete the event
 * @param reloadChips - Function to reload chips
 * @param getItems - Optional function to get all items (for weekly planner)
 */
export async function deleteEventsLoadChips(
    planEvents: IPlannerEvent[],
    reloadChips: () => Promise<void>,
    items: IPlannerEvent[]
) {
    await deleteEvents(planEvents);
    if (planEvents.some(item => item.calendarId) || (planEvents.some(planEvent => items.find(i => i.id === planEvent.id)?.calendarId))) {
        await reloadChips();
    }
}

/**
 * Builds a planner for the given ID out of the storage, calendar, and recurring weekday planner.
 */
export async function buildPlannerEvents(
    datestamp: string,
    storagePlanner: TPlanner,
    calendarEvents: IPlannerEvent[]
): Promise<IPlannerEvent[]> {

    const planner = { ...storagePlanner };

    // Phase 1: Sync in any recurring events for the day of the week.
    const recurringPlanner = getRecurringPlannerFromStorage(datestampToDayOfWeek(datestamp));
    planner.events = syncPlannerWithRecurring(recurringPlanner, planner.events, datestamp);

    // Phase 2: Sync in any recurring events for the day of the week.
    planner.events = syncPlannerWithCalendar(calendarEvents, planner.events, datestamp);

    // Delete past planners and carry over incomplete yesterday events
    if (datestamp === getTodayDatestamp()) {
        const remainingYesterdayEvents = getCarryoverEventsAndCleanStorage();
        if (remainingYesterdayEvents.length > 0) {

            // Carry over yesterday's incomplete events to today
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
    }

    // Phase 4: TODO comment
    if (planner.events.some(planEvent =>
        !storagePlanner.events.some(existingEvent => existingEvent.id === planEvent.id)
    )) savePlannerToStorage(datestamp, planner);

    return planner.events;
};

/**
 * Syncs an existing planner with a calendar. Calendars have final say on the state of the events.
 * @param calendar - the events to sync within the existing planner
 * @param plannerEvents - the planner being updated
 * @param timestamp
 * @returns - the new planner synced with the calendar
 */
export function syncPlannerWithCalendar(
    calendar: IPlannerEvent[],
    plannerEvents: IPlannerEvent[],
    timestamp: string
) {
    // console.info('syncPlannerWithCalendar: START', { calendar, planner, timestamp });

    // Loop over the existing planner, removing any calendar events that no longer exist
    // in the new device calendar. All existing linked events will also be updated to reflect the
    // calendar.
    const newPlanner = plannerEvents.reduce<IPlannerEvent[]>((accumulator, planEvent) => {

        // This event isn't related to the calendar -> keep it
        if (!planEvent.calendarId || planEvent.status === EItemStatus.HIDDEN) {
            return [...accumulator, planEvent];
        }

        // This event is linked to the calendar and still exists -> update it
        const calEvent = calendar.find(calEvent => calEvent.id === planEvent.calendarId);
        if (calEvent) {
            // Generate an updated record of the calendar event
            const updatedEvent = {
                ...planEvent,
                timeConfig: calEvent.timeConfig,
                value: calEvent.value,
            }

            // Add the updated event to the current planner
            const updatedPlanner = [...accumulator, updatedEvent];

            // Generate the updated event's new position in the list
            updatedEvent.sortId = generateSortIdByTime(updatedEvent, updatedPlanner);
            return updatedPlanner;
        } else {
            // This event is linked to the calendar but has been removed -> delete it
            return [...accumulator];
        }
    }, []);

    // Find any new events in the calendar and add these to the new planner
    calendar.forEach(calEvent => {
        if (!newPlanner.find(planEvent => planEvent.calendarId === calEvent.id)) {

            // Generate a new record to represent the calendar event
            const newEvent = {
                ...calEvent,
                listId: timestamp,
                calendarId: calEvent.id
            };

            // Add the new event to the planner and generate its position within the list
            newPlanner.push(newEvent);
            newEvent.sortId = generateSortIdByTime(newEvent, newPlanner);
        }
    });

    // console.info('syncPlannerWithCalendar: END', newPlanner);
    return newPlanner;
}

/**
 * Syncs an existing planner with the recurring weekday planner. The recurring planner has
 * final say on the state of the events. If a recurring event is manually deleted from a planner, 
 * it will remain deleted.
 * @param recurringPlanner - the events to sync within the existing planner
 * @param plannerEvents - the planner being updated
 * @param timestamp
 * @returns - the new planner synced with the recurring events
 */
export function syncPlannerWithRecurring(
    recurringPlanner: IRecurringEvent[],
    plannerEvents: IPlannerEvent[],
    timestamp: string
) {
    // console.info('syncPlannerWithRecurring: START', { recurringPlanner, planner, timestamp })

    function getRecurringEventTimeConfig(recEvent: IRecurringEvent) {
        return {
            startTime: timeValueToIso(timestamp, recEvent.startTime!),
            allDay: false,
            endTime: timeValueToIso(timestamp, '23:55'),
            isCalendarEvent: false
        }
    };

    // Build the new planner out of the recurring planner. All recurring events will prioritize the
    // recurring planner's values.
    const newPlanner = recurringPlanner.reduce<IRecurringEvent[]>((accumulator, recEvent) => {
        const planEvent = plannerEvents.find(planEvent => planEvent.recurringId === recEvent.id);

        if (planEvent?.status === EItemStatus.HIDDEN) {
            // This event has been manually deleted -> keep it deleted
            return [...accumulator, planEvent];
        }

        if (planEvent) {
            // This recurring event is in the current planner -> update it
            const updatedEvent: IPlannerEvent = {
                id: planEvent.id,
                listId: timestamp,
                status: planEvent.status,
                sortId: planEvent.sortId,
                recurringId: recEvent.id,
                value: recEvent.value,
            };

            // Add event time
            if (planEvent.timeConfig) {
                updatedEvent.timeConfig = planEvent.timeConfig;
            } else if (recEvent.startTime) {
                updatedEvent.timeConfig = getRecurringEventTimeConfig(recEvent);
            }

            // Add calendar link
            if (planEvent.calendarId) {
                updatedEvent.calendarId = planEvent.calendarId;
            }

            // Add sort position
            const updatedPlanner = [...accumulator, updatedEvent];
            updatedEvent.sortId = generateSortIdByTime(updatedEvent, updatedPlanner);

            return updatedPlanner;
        } else {
            // This recurring event hasn't been added to the planner yet -> add it 
            const newEvent: IPlannerEvent = {
                id: uuid.v4(),
                listId: timestamp,
                recurringId: recEvent.id,
                value: recEvent.value,
                sortId: recEvent.sortId,
                status: recEvent.status
            };

            // Add event time
            if (recEvent.startTime) {
                newEvent.timeConfig = getRecurringEventTimeConfig(recEvent);
            }

            // Add sort position
            const updatedPlanner = [...accumulator, newEvent];
            newEvent.sortId = generateSortIdByTime(newEvent, updatedPlanner);

            return updatedPlanner;
        }
    }, []);

    // Add in any existing events that aren't recurring
    plannerEvents?.forEach(existingPlanEvent => {
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