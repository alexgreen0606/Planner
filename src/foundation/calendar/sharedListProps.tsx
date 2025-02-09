import PlannerEventTimeModal from "../../feature/planners/components/modal/TimeModal";
import { isItemDeleting, isItemTextfield } from "../sortedLists/sortedListUtils";
import { Color } from "../theme/colors";
import { PlannerEvent, RecurringEvent } from "./calendarUtils";
import TimeValue from "./components/TimeValue";
import { extractTimeValue, generateSortIdByTime, getEventTime } from "./dateUtils";

export function handleEventInput(
    text: string,
    item: PlannerEvent | RecurringEvent,
    currentList: (PlannerEvent | RecurringEvent)[],
    datestamp?: string,
): PlannerEvent | RecurringEvent {
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
                (newEvent as RecurringEvent).startTime = timeConfig.startTime;
            } else {
                (newEvent as PlannerEvent).timeConfig = timeConfig;
            }
            newEvent.sortId = generateSortIdByTime(newEvent, updatedList);
            return newEvent;
        }
    }
    return { ...item, value: text };
}

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

export function generateTimeModalConfig(
    item: PlannerEvent,
    timeModalOpen: boolean,
    toggleTimeModal: (item: PlannerEvent) => void,
    datestamp: string,
    currentList: PlannerEvent[]
) {
    return {
        component: PlannerEventTimeModal,
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

export function generateTimeIconConfig(
    item: PlannerEvent | RecurringEvent,
    toggleTimeModal: (item: PlannerEvent | RecurringEvent) => void
) {
    const itemTime = getEventTime(item);
    return {
        hideIcon: !itemTime && !isItemTextfield(item),
        icon: {
            type: 'clock',
            color: Color.DIM
        },
        onClick: toggleTimeModal,
        customIcon: itemTime ?
            <TimeValue allDay={!!(item as PlannerEvent).timeConfig?.allDay} timeValue={itemTime} />
            : undefined
    }
}

export function generateCheckboxIconConfig(
    item: PlannerEvent | RecurringEvent,
    toggleItemDelete: (item: PlannerEvent | RecurringEvent) => void
) {
    const itemTime = getEventTime(item);
    return {
        icon: {
            type: isItemDeleting(item) ? 'circle-filled' : 'circle',
            color: isItemDeleting(item) ? Color.BLUE : Color.DIM
        },
        onClick: toggleItemDelete
    }
}