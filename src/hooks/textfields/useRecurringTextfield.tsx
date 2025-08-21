import { TIconType } from "@/components/icon";
import { ToolbarIcon } from "@/components/lists/components/ListToolbar";
import { EStorageId } from "@/lib/enums/EStorageId";
import { IRecurringEvent } from "@/lib/types/listItems/IRecurringEvent";
import { getRecurringPlannerFromStorageById, saveRecurringPlannerToStorage } from "@/storage/recurringPlannerStorage";
import { getIsoFromNowTimeRoundedDown5Minutes } from "@/utils/dateUtils";
import { updateRecurringEventIndexWithChronologicalCheck } from "@/utils/recurringPlannerUtils";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { DateTime } from "luxon";
import { useMemo, useState } from "react";
import { useMMKV } from "react-native-mmkv";
import { useTextfieldItemAs } from "./useTextfieldItemAs";

const useRecurringTextfield = () => {

    const recurringEventStorage = useMMKV({ id: EStorageId.RECURRING_PLANNER_EVENT });

    const {
        textfieldId,
        textfieldItem,
        onSetTextfieldId,
        onSetTextfieldItem
    } = useTextfieldItemAs<IRecurringEvent>(recurringEventStorage);

    const [showTimeInToolbarForUntimedEvent, setShowTimeInToolbarForUntimedEvent] = useState(false);

    const textfieldDate = useMemo(() => {
        if (textfieldItem?.startTime) {
            const [hour, minute] = textfieldItem.startTime.split(':').map(Number);
            const dateTime = DateTime.local().set({ hour, minute, second: 0, millisecond: 0 });
            return dateTime.toJSDate();
        } else {
            return DateTime.fromISO(getIsoFromNowTimeRoundedDown5Minutes()).toJSDate();
        }
    }, [textfieldItem?.startTime]);

    const toolbarIcons: ToolbarIcon<IRecurringEvent>[][] = [[{
        type: 'clock' as TIconType,
        onClick: () => { textfieldItem && handleShowEventTime(textfieldItem) },
        customIcon: textfieldItem?.startTime || showTimeInToolbarForUntimedEvent ? (
            <DateTimePicker
                mode='time'
                minuteInterval={5}
                value={textfieldDate}
                onChange={handleTimeChangeUpdateSortId}
            />
        ) : undefined
    }]];

    function handleTimeChangeUpdateSortId(event: DateTimePickerEvent) {
        if (!textfieldItem) return;

        let newEvent = { ...textfieldItem };

        const planner = getRecurringPlannerFromStorageById(textfieldItem.listId);
        const currentIndex = planner.eventIds.findIndex((e) => e === textfieldItem.id);
        if (currentIndex === -1) {
            throw new Error(`handleTimeChangeUpdateSortId: Item with ID ${textfieldItem.id} does not exist in planner with ID ${textfieldItem.listId}`);
        }

        // Phase 1: Clone modified weekday events to allow customization.
        // The original event will be hidden and replaced with the clone.
        if (newEvent.weekdayEventId) {

            // Hide this recurring event record.
            const recurringPlanner = getRecurringPlannerFromStorageById(newEvent.listId);
            saveRecurringPlannerToStorage({
                ...recurringPlanner,
                deletedWeekdayEventIds: [...recurringPlanner.deletedWeekdayEventIds, newEvent.weekdayEventId]
            });

            delete newEvent.weekdayEventId;
        }

        const selected = DateTime.fromMillis(event.nativeEvent.timestamp);
        const recEvent: IRecurringEvent = {
            ...newEvent,
            startTime: selected.toFormat('HH:mm')
        };

        updateRecurringEventIndexWithChronologicalCheck(currentIndex, recEvent);
        onSetTextfieldItem(recEvent);
    }

    function handleShowEventTime(item: IRecurringEvent) {
        if (textfieldId !== item.id) {
            // If this isn't the textfield, make it so.
            onSetTextfieldId(item.id);
        }

        setShowTimeInToolbarForUntimedEvent(true);
    }

    return {
        toolbarIcons,
        onShowEventTime: handleShowEventTime
    };
};

export default useRecurringTextfield;