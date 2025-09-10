import GenericIcon from "@/components/icon";
import { ERecurringPlannerId } from "@/lib/enums/ERecurringPlannerKey";
import { EStorageId } from "@/lib/enums/EStorageId";
import { IRecurringEvent } from "@/lib/types/listItems/IRecurringEvent";
import { TRecurringPlanner } from "@/lib/types/planner/TRecurringPlanner";
import { getRecurringEventFromStorageById, getRecurringPlannerFromStorageById } from "@/storage/recurringPlannerStorage";
import { createEmptyRecurringPlanner, deleteRecurringEventsFromStorageHideWeekday, updateRecurringEventIndexWithChronologicalCheck, upsertWeekdayEventsToRecurringPlanner } from "@/utils/recurringPlannerUtils";
import { MenuView } from "@react-native-menu/menu";
import { MMKV, useMMKV, useMMKVObject } from "react-native-mmkv";
import useAppTheme from "../useAppTheme";

// ✅ 

enum ERecurringPlannerEditAction {
    RESET_WEEKDAY = 'RESET_WEEKDAY',
    DELETE_WEEKDAY = 'DELETE_WEEKDAY',
    DELETE_ALL = 'DELETE_ALL'
}

const useRecurringPlanner = (recurringPlannerId: string, recurringEventStorage: MMKV) => {
    const recurringStorage = useMMKV({ id: EStorageId.RECURRING_PLANNER });

    const [recurringPlanner, setRecurringPlanner] = useMMKVObject<TRecurringPlanner>(recurringPlannerId, recurringStorage);

    const { overflowText } = useAppTheme();

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
        onUpdateRecurringEventIndexWithChronologicalCheck: handleUpdateRecurringEventIndexWithChronologicalCheck
    }
};

export default useRecurringPlanner;