import { IconType } from "../components/GenericIcon";
import { isItemTextfield } from "../sortedLists/utils";
import TimeModal from "./components/TimeModal";
import TimeValue from "./components/values/TimeValue";
import { extractTimeValue, generateSortIdByTime, getEventTime } from "./timestampUtils";
import { Deadline, PlannerEvent, RecurringEvent } from "./types";

/**
 * SHARED EVENT LIST PROPS
 * The below functions are all shared props among any list that represents planner events.
 **/

/**
 * handleValueChange Prop: extracts any typed time value and uses it to mark the event's start time.
 * The time value will be removed from the event's value and place in the event's time config instead.
 * Recurring events and Planner events can both be handled. 
 */
export function handleEventInput(
    text: string,
    item: PlannerEvent | RecurringEvent | Deadline,
    currentList: (PlannerEvent | RecurringEvent | Deadline)[],
    datestamp?: string,
): PlannerEvent | RecurringEvent | Deadline {
    const itemTime = getEventTime(item);
    if (!itemTime) {
        const { timeConfig, updatedText } = extractTimeValue(text, datestamp);
        if (timeConfig) {
            const newEvent = { ...item, value: updatedText };
            const updatedList = [...currentList];
            const itemCurrentIndex = currentList.findIndex(listItem => listItem.id === item.id);
            if (itemCurrentIndex !== -1) {
                updatedList[itemCurrentIndex] = newEvent;
            } else {
                updatedList.push(newEvent);
            }
            if (datestamp) {
                (newEvent as RecurringEvent | Deadline).startTime = timeConfig.startTime;
            } else {
                (newEvent as PlannerEvent).timeConfig = timeConfig;
            }
            newEvent.sortId = generateSortIdByTime(newEvent, updatedList);
            return newEvent;
        }
    }
    return { ...item, value: text };
}

/**
 * onDragEnd Prop: enforces accurate list sorting for any timed events.
 * If the dragged item has a time specified, its new position will check it doesn't break time logic.
 * If time logic is broken, the drag will be canceled.
 */
export async function handleDragEnd(
    item: PlannerEvent | RecurringEvent,
    currentList: (PlannerEvent | RecurringEvent)[],
    refetchItems: () => void,
    saveItem: (item: PlannerEvent | RecurringEvent) => Promise<void>
) {
    const itemTime = getEventTime(item);
    if (itemTime) {
        const currentItemIndex = currentList.findIndex(listItem => listItem.id === item.id);
        if (currentItemIndex !== -1) {
            const initialSortId = currentList[currentItemIndex].sortId;
            const updatedItems = [...currentList];
            updatedItems[currentItemIndex] = item;
            const newSortId = generateSortIdByTime(item, updatedItems);
            item.sortId = newSortId;
            if (newSortId === initialSortId) {

                // The item has a time conflict. Cancel drag.
                refetchItems();
            }
        }
    }
    await saveItem(item);
}

/**
 * getModal Prop: generates the config for the event time modal.
 */
export function generateTimeModalConfig(
    item: PlannerEvent,
    timeModalOpen: boolean,
    toggleTimeModal: (item: PlannerEvent) => void,
    datestamp: string,
    currentList: PlannerEvent[]
) {
    return {
        component: TimeModal,
        props: {
            open: timeModalOpen,
            toggleModalOpen: toggleTimeModal,
            timestamp: datestamp,
            onSave: (updatedItem: PlannerEvent) => {
                const updatedList = [...currentList];
                const itemCurrentIndex = currentList.findIndex(item => item.id === updatedItem.id);
                if (itemCurrentIndex !== -1) {
                    updatedList[itemCurrentIndex] = updatedItem;
                } else {
                    updatedList.push(updatedItem);
                }
                updatedItem.sortId = generateSortIdByTime(updatedItem, updatedList);
                toggleTimeModal(updatedItem);
                return updatedItem;
            },
            item
        },
    }
}

/**
 * getLeftIcon Prop: generates the config for the event time modal trigger icon.
 */
export function generateTimeIconConfig(
    item: PlannerEvent | RecurringEvent,
    toggleTimeModal: (item: PlannerEvent | RecurringEvent) => void
) {
    const itemTime = getEventTime(item);
    return {
        hideIcon: !itemTime && !isItemTextfield(item),
        icon: {
            type: 'clock' as IconType,
        },
        onClick: toggleTimeModal,
        customIcon: itemTime ?
            <TimeValue
                allDay={!!(item as PlannerEvent).timeConfig?.allDay}
                endEvent={!!(item as PlannerEvent).timeConfig?.isEndEvent}
                timeValue={itemTime}
            /> : undefined
    }
}