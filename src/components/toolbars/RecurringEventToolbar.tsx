import { View } from "react-native";
import GenericIcon from "../icon";
import ListToolbar from "../lists/components/ListToolbar";
import { IRecurringEvent } from "@/lib/types/listItems/IRecurringEvent";
import { updateRecurringEventIndexWithChronologicalCheck } from "@/utils/recurringPlannerUtils";
import { useMemo, useState } from "react";
import useTextfieldItemAs from "@/hooks/useTextfieldItemAs";
import { useMMKV, useMMKVObject } from "react-native-mmkv";
import { EStorageId } from "@/lib/enums/EStorageId";
import { DateTime } from "luxon";
import { getIsoFromNowTimeRoundedDown5Minutes } from "@/utils/dateUtils";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { TRecurringPlanner } from "@/lib/types/planner/TRecurringPlanner";

// ✅ 

const RecurringEventToolbar = () => {
    const recurringPlannerStorage = useMMKV({ id: EStorageId.RECURRING_PLANNER });
    const recurringEventStorage = useMMKV({ id: EStorageId.RECURRING_PLANNER_EVENT });

    const [showTimeInToolbarForUntimedEvent, setShowTimeInToolbarForUntimedEvent] = useState(false);

    const {
        textfieldId: focusedEventId,
        textfieldItem: focusedEvent,
        onSetTextfieldId: onSetFocusedEventId,
        onSetTextfieldItem: onSetFocusedEvent
    } = useTextfieldItemAs<IRecurringEvent>(recurringEventStorage);

    const [recurringPlanner, setRecurringPlanner] = useMMKVObject<TRecurringPlanner>(focusedEvent?.listId ?? 'EMPTY', recurringPlannerStorage);

    const focusedDate = useMemo(() => {
        if (focusedEvent?.startTime) {
            const [hour, minute] = focusedEvent.startTime.split(':').map(Number);
            const dateTime = DateTime.local().set({ hour, minute, second: 0, millisecond: 0 });
            return dateTime.toJSDate();
        } else {
            return DateTime.fromISO(getIsoFromNowTimeRoundedDown5Minutes()).toJSDate();
        }
    }, [focusedEvent?.startTime]);

    const iconSet = [
        [(
            <GenericIcon
                type='clock'
                onClick={() => focusedEvent && showEventTime(focusedEvent)}
            />
        )],
        [focusedEvent?.startTime || showTimeInToolbarForUntimedEvent ? (
            <DateTimePicker
                mode='time'
                minuteInterval={5}
                value={focusedDate}
                onChange={updateRecurringEventTimeWithChronologicalCheck}
            />
        ) : (
            <View className='w-28 items-center'>
                <GenericIcon
                    type='clock'
                    onClick={() => focusedEvent && showEventTime(focusedEvent)}
                    platformColor="label"
                />
            </View>
        )]
    ];

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

    function showEventTime(item: IRecurringEvent) {
        if (focusedEventId !== item.id) {
            // If this isn't the textfield, make it so.
            onSetFocusedEventId(item.id);
        }

        setShowTimeInToolbarForUntimedEvent(true);
    }

    return (
        <ListToolbar
            hide={focusedEvent?.storageId !== EStorageId.RECURRING_PLANNER_EVENT}
            iconSet={iconSet}
        />
    )
};

export default RecurringEventToolbar;