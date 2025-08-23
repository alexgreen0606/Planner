import { TIconType } from "@/components/icon";
import { ToolbarIcon } from "@/components/lists/components/ListToolbar";
import { EStorageId } from "@/lib/enums/EStorageId";
import { IRecurringEvent } from "@/lib/types/listItems/IRecurringEvent";
import { TRecurringPlanner } from "@/lib/types/planner/TRecurringPlanner";
import { getRecurringPlannerFromStorageById } from "@/storage/recurringPlannerStorage";
import { getIsoFromNowTimeRoundedDown5Minutes, parseTimeValueFromText } from "@/utils/dateUtils";
import { createEmptyRecurringPlanner, updateRecurringEventIndexWithChronologicalCheck } from "@/utils/recurringPlannerUtils";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { DateTime } from "luxon";
import { useMemo, useState } from "react";
import { MMKV, useMMKV, useMMKVObject } from "react-native-mmkv";
import { useTextfieldItemAs } from "./textfields/useTextfieldItemAs";

// ✅ 

const useRecurringPlanner = (recurringPlannerId: string, recurringEventStorage: MMKV) => {
    const recurringStorage = useMMKV({ id: EStorageId.RECURRING_PLANNER });

    const [recurringPlanner, setRecurringPlanner] = useMMKVObject<TRecurringPlanner>(recurringPlannerId, recurringStorage);

    const {
        textfieldId: focusedEventId,
        textfieldItem: focusedEvent,
        onSetTextfieldId: onSetFocusedEventId,
        onSetTextfieldItem: onSetFocusedEvent
    } = useTextfieldItemAs<IRecurringEvent>(recurringEventStorage);

    const [showTimeInToolbarForUntimedEvent, setShowTimeInToolbarForUntimedEvent] = useState(false);

    const textfieldDate = useMemo(() => {
        if (focusedEvent?.startTime) {
            const [hour, minute] = focusedEvent.startTime.split(':').map(Number);
            const dateTime = DateTime.local().set({ hour, minute, second: 0, millisecond: 0 });
            return dateTime.toJSDate();
        } else {
            return DateTime.fromISO(getIsoFromNowTimeRoundedDown5Minutes()).toJSDate();
        }
    }, [focusedEvent?.startTime]);

    // =====================
    // 1. Exposed Functions
    // =====================

    // Scan user input for an initial event time.
    // Delete weekday event and clone if needed.
    function handleUpdateRecurringEventValueWithTimeParsing(userInput: string) {
        onSetFocusedEvent((prev) => {
            if (!prev || !recurringPlanner) return prev;

            const newEvent = { ...prev, value: userInput };
            const newPlanner = { ...recurringPlanner };

            // Phase 1: If weekday recurring, delete the event so it can be customized.
            if (newEvent.weekdayEventId) {
                newPlanner.deletedWeekdayEventIds.push(newEvent.weekdayEventId);
                delete newEvent.weekdayEventId;
            }

            // Don't scan for time values if the event is already timed.
            if (newEvent.startTime) return newEvent;

            // Phase 2: Parse time from user input.
            const { timeValue, updatedText } = parseTimeValueFromText(userInput);
            if (!timeValue) return newEvent;

            newEvent.value = updatedText;
            newEvent.startTime = timeValue;

            // Phase 4: Check chronological order and update index if needed.
            const planner = getRecurringPlannerFromStorageById(newEvent.listId);
            const currentIndex = planner.eventIds.findIndex(e => e === newEvent.id);
            if (currentIndex === -1) {
                throw new Error(`handleUpdateRecurringEventValueWithTimeParsing: No event exists in recurring planner ${newEvent.listId} with ID ${newEvent.id}`);
            }

            // Save the planner and event to storage.
            setRecurringPlanner(
                updateRecurringEventIndexWithChronologicalCheck(newPlanner, currentIndex, newEvent)
            )
            return newEvent;
        });
    }

    function handleUpdateRecurringEventIndexWithChronologicalCheck(index: number, event: IRecurringEvent) {
        setRecurringPlanner((prev) => {
            const newPlanner = prev ?? createEmptyRecurringPlanner(recurringPlannerId);
            return updateRecurringEventIndexWithChronologicalCheck(newPlanner, index, event);
        });
    }

    function showEventTime(item: IRecurringEvent) {
        if (focusedEventId !== item.id) {
            // If this isn't the textfield, make it so.
            onSetFocusedEventId(item.id);
        }

        setShowTimeInToolbarForUntimedEvent(true);
    }

    // ===================
    // 2. Helper Function
    // ===================

    function updateRecurringEventTimeWithChronologicalCheck(event: DateTimePickerEvent) {
        onSetFocusedEvent((prev) => {
            if (!prev || !recurringPlanner) return prev;

            const newEvent = { ...prev };
            const newPlanner = { ...recurringPlanner };

            // If weekday recurring, delete the event so it can be customized.
            if (newEvent.weekdayEventId) {
                newPlanner.deletedWeekdayEventIds.push(newEvent.weekdayEventId);
                delete newEvent.weekdayEventId;
            }

            // Set the new time in the event.
            const selectedTime = DateTime.fromMillis(event.nativeEvent.timestamp);
            newEvent.startTime = selectedTime.toFormat('HH:mm');

            const currentIndex = newPlanner.eventIds.findIndex((e) => e === newEvent.id);
            if (currentIndex === -1) {
                throw new Error(`updateEventTimeWithChronologicalCheck: Item with ID ${newEvent.id} does not exist in recurring planner with ID ${newEvent.listId}`);
            }

            // Save the planner and event to storage.
            setRecurringPlanner(
                updateRecurringEventIndexWithChronologicalCheck(newPlanner, currentIndex, newEvent)
            );
            return newEvent;
        });
    }

    // =========================
    // 3. Toolbar Configuration
    // =========================

    const toolbarIcons: ToolbarIcon<IRecurringEvent>[][] = [[{
        type: 'clock' as TIconType,
        onClick: () => { focusedEvent && showEventTime(focusedEvent) },
        customIcon: focusedEvent?.startTime || showTimeInToolbarForUntimedEvent ? (
            <DateTimePicker
                mode='time'
                minuteInterval={5}
                value={textfieldDate}
                onChange={updateRecurringEventTimeWithChronologicalCheck}
            />
        ) : undefined
    }]];

    return {
        eventIds: recurringPlanner?.eventIds ?? [],
        toolbarIcons,
        onShowEventTime: showEventTime,
        onUpdateRecurringEventValueWithTimeParsing: handleUpdateRecurringEventValueWithTimeParsing,
        onUpdateRecurringEventIndexWithChronologicalCheck: handleUpdateRecurringEventIndexWithChronologicalCheck
    };
};

export default useRecurringPlanner;