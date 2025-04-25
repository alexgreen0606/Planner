import Toolbar, { ToolbarProps } from "../sortedLists/components/ListItemToolbar";
import { ModifyItemConfig } from "../sortedLists/types";
import { isItemTextfield } from "../sortedLists/utils";
import TimeModal from "./components/timeModal/TimeModal";
import TimeValue from "./components/values/TimeValue";
import { extractTimeValue, generateSortIdByTime, getEventTime } from "./timestampUtils";
import { PlannerEvent, RecurringEvent } from "./types";

/**
 * SHARED EVENT LIST PROPS
 * The below functions are all shared props among any list that represents planner events.
 **/

/**
 * @handleValueChange Prop: extracts any typed time value and uses it to mark the event's start time.
 * The time value will be removed from the event @value and placed in the @timeConfig instead.
 * Recurring events and Planner events can both be handled.
 * 
 * When param @datestamp is received, the item is a Planner Event. Otherwise it is a Recurring Event.
 */
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

/**
 * @onDragEnd Prop: enforces accurate list sorting for any timed events.
 * If the dragged item has a time specified, its new position will check it doesn't break time logic.
 * If time logic is broken, the drag will be canceled.
 */
export async function handleDragEnd(
    item: PlannerEvent | RecurringEvent,
    currentList: (PlannerEvent | RecurringEvent)[],
    refetchItems: () => void,
    saveItem: (item: PlannerEvent | RecurringEvent) => Promise<void | string>
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
                // The item has a time conflict or has not moved. Cancel Drag.
                refetchItems();
            }
        }
    }
    await saveItem(item);
}

/**
 * @getModal Prop: generates the config for the event time modal.
 */
export function generateTimeModalConfig(
    item: PlannerEvent,
    timeModalOpen: boolean,
    toggleTimeModal: (item: PlannerEvent) => void,
    datestamp: string,
    currentList: PlannerEvent[],
    setCurrentTextfield: React.Dispatch<PlannerEvent>
) {
    return {
        component: TimeModal,
        props: {
            item,
            timestamp: datestamp,
            open: timeModalOpen,
            toggleModalOpen: toggleTimeModal,
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
                setCurrentTextfield(updatedItem);
            },
            hideKeyboard: timeModalOpen
        }
    }
}

/**
 * @getLeftIcon Prop: generates the config for the event time modal trigger icon.
 */
export function generateTimeIconConfig(
    item: PlannerEvent | RecurringEvent,
    toggleTimeModal: (item: PlannerEvent | RecurringEvent) => void
) {
    const itemTime = getEventTime(item);
    return {
        hideIcon: !itemTime,
        onClick: toggleTimeModal,
        customIcon: (
            <TimeValue
                allDay={!!(item as PlannerEvent).timeConfig?.allDay}
                endEvent={!!(item as PlannerEvent).timeConfig?.multiDayEnd}
                startEvent={!!(item as PlannerEvent).timeConfig?.multiDayStart}
                timeValue={itemTime!}
            />
        )
    }
}

/**
 * @getToolbar Prop: generates the config for the planner event toolbar.
 * The toolbar allows for opening the time modal.
 */
export function generateEventToolbar(
    item: PlannerEvent | RecurringEvent,
    toggleTimeModal: (item: PlannerEvent | RecurringEvent) => void,
    timeModalOpen: boolean
): ModifyItemConfig<PlannerEvent | RecurringEvent, ToolbarProps<PlannerEvent | RecurringEvent>> {
    return {
        component: Toolbar,
        props: {
            item,
            open: !timeModalOpen && isItemTextfield(item),
            iconSets: [[{
                type: 'clock',
                onClick: () => toggleTimeModal(item),
            }]]
        }
    }
}