import GenericIcon from "@/components/icon";
import { ERecurringPlannerId } from "@/lib/enums/ERecurringPlannerKey";
import { EStorageId } from "@/lib/enums/EStorageId";
import { IRecurringEvent } from "@/lib/types/listItems/IRecurringEvent";
import { TRecurringPlanner } from "@/lib/types/planner/TRecurringPlanner";
import { getRecurringEventFromStorageById, getRecurringPlannerFromStorageById } from "@/storage/recurringPlannerStorage";
import { parseTimeValueFromText } from "@/utils/dateUtils";
import { createEmptyRecurringPlanner, deleteRecurringEventsFromStorageHideWeekday, updateRecurringEventIndexWithChronologicalCheck, upsertWeekdayEventsToRecurringPlanner } from "@/utils/recurringPlannerUtils";
import { MenuView } from "@react-native-menu/menu";
import { MMKV, useMMKV, useMMKVObject } from "react-native-mmkv";
import useAppTheme from "./useAppTheme";
import useTextfieldItemAs from "./useTextfieldItemAs";

// ✅ 

enum ERecurringPlannerEditAction {
    RESET_WEEKDAY = 'RESET_WEEKDAY',
    DELETE_WEEKDAY = 'DELETE_WEEKDAY',
    DELETE_ALL = 'DELETE_ALL'
}

const useRecurringPlanner = (recurringPlannerId: string, recurringEventStorage: MMKV) => {
    const recurringStorage = useMMKV({ id: EStorageId.RECURRING_PLANNER });

    const [recurringPlanner, setRecurringPlanner] = useMMKVObject<TRecurringPlanner>(recurringPlannerId, recurringStorage);

    const {
        onSetTextfieldItem: onSetFocusedEvent
    } = useTextfieldItemAs<IRecurringEvent>(recurringEventStorage);

    const { overflowText } = useAppTheme();

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

    function handleAction(action: ERecurringPlannerEditAction) {
        if (!recurringPlanner) return;

        const allEvents = recurringPlanner.eventIds.map(getRecurringEventFromStorageById);

        switch (action) {
            case ERecurringPlannerEditAction.DELETE_ALL:
                deleteRecurringEventsFromStorageHideWeekday(allEvents);
                break;
            case ERecurringPlannerEditAction.DELETE_WEEKDAY:
                const allWeekdayEvents = allEvents.filter((e) => e.weekdayEventId);
                deleteRecurringEventsFromStorageHideWeekday(allWeekdayEvents);
                break;
            case ERecurringPlannerEditAction.RESET_WEEKDAY:
                setRecurringPlanner((prev) => prev ? ({
                    ...prev,
                    deletedWeekdayEventIds: []
                }) : prev);
                const weekdayPlannerIds = getRecurringPlannerFromStorageById(ERecurringPlannerId.WEEKDAYS);
                const weekdayEvents = weekdayPlannerIds.eventIds.map(getRecurringEventFromStorageById);
                upsertWeekdayEventsToRecurringPlanner(weekdayEvents, recurringPlannerId);
                break;
        }
    }

    // ====================
    // 3. Overflow Actions
    // ====================

    const overflowActions = [
        ...(recurringPlannerId !== ERecurringPlannerId.WEEKDAYS
            ? [
                {
                    id: 'weekday',
                    title: 'Manage Weekday',
                    image: 'repeat',
                    imageColor: overflowText,
                    subactions: [
                        {
                            id: ERecurringPlannerEditAction.RESET_WEEKDAY,
                            title: 'Reset Weekday',
                            subtitle: 'Customized weekday events will be reset.',
                            image: 'arrow.trianglehead.2.clockwise',
                            imageColor: overflowText,
                        },
                        {
                            id: ERecurringPlannerEditAction.DELETE_WEEKDAY,
                            title: 'Delete All Weekday',
                            attributes: { destructive: true },
                            image: 'trash',
                            imageColor: 'rgb(208,77,64)',
                        },
                    ],
                },
            ]
            : []),
        {
            id: ERecurringPlannerEditAction.DELETE_ALL,
            title: 'Delete All Events',
            attributes: { destructive: true },
            image: 'trash',
            imageColor: 'rgb(208,77,64)',
        },
    ];

    const OverflowIcon = () => (
        <MenuView
            title={recurringPlannerId}
            onPressAction={({ nativeEvent }) => {
                handleAction(nativeEvent.event as ERecurringPlannerEditAction);
            }}
            actions={overflowActions}
            shouldOpenOnLongPress={false}
        >
            <GenericIcon size='l' type='more' platformColor='systemBlue' />
        </MenuView>
    );

    return {
        eventIds: recurringPlanner?.eventIds ?? [],
        OverflowIcon,
        onUpdateRecurringEventValueWithTimeParsing: handleUpdateRecurringEventValueWithTimeParsing,
        onUpdateRecurringEventIndexWithChronologicalCheck: handleUpdateRecurringEventIndexWithChronologicalCheck
    }
};

export default useRecurringPlanner;