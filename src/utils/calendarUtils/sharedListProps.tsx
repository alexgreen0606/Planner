import { IPlannerEvent } from "@/types/listItems/IPlannerEvent";
import TimeValue from "../../components/text/TimeValue";
import Toolbar, { ToolbarProps } from "../../feature/sortedList/components/ListItemToolbar";
import { isItemTextfield } from "../../feature/sortedList/utils";
import { extractTimeValue, generateSortIdByTime, getEventTime } from "./timestampUtils";
import { IRecurringEvent } from "@/types/listItems/IRecurringEvent";
import { ModifyItemConfig } from "@/feature/sortedList/lib/listRowConfig";

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
    item: IPlannerEvent | IRecurringEvent,
    currentList: (IPlannerEvent | IRecurringEvent)[],
    datestamp?: string,
): IPlannerEvent | IRecurringEvent {
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
                (newEvent as IRecurringEvent).startTime = timeConfig.startTime;
            } else {
                (newEvent as IPlannerEvent).timeConfig = timeConfig;
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
    item: IPlannerEvent | IRecurringEvent,
    currentList: (IPlannerEvent | IRecurringEvent)[],
    refetchItems: () => void,
    saveItem: (item: IPlannerEvent | IRecurringEvent) => Promise<void | string>
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
                // The item has a time conflict or has not moved. Undo Drag.
                refetchItems();
            }
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
    if (itemTime) {
        console.log(event)
    }
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