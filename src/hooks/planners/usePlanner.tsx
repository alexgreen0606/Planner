import GenericIcon from "@/components/icon";
import { EStorageId } from "@/lib/enums/EStorageId";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { TPlanner } from "@/lib/types/planner/TPlanner";
import { deletePlannerEventFromStorageById, getPlannerEventFromStorageById } from "@/storage/plannerStorage";
import { getRecurringPlannerFromStorageById } from "@/storage/recurringPlannerStorage";
import { getDayOfWeekFromDatestamp, getMonthDateFromDatestamp } from "@/utils/dateUtils";
import { createEmptyPlanner, updatePlannerEventIndexWithChronologicalCheck, upsertRecurringEventsIntoPlanner } from "@/utils/plannerUtils";
import { MenuView } from "@react-native-menu/menu";
import { useEffect, useState } from "react";
import { MMKV, useMMKV, useMMKVListener, useMMKVObject } from "react-native-mmkv";
import useOverflowActions from "../useOverflowActions";
import useTextfieldItemAs from "../useTextfieldItemAs";

// ✅ 

enum EPlannerEditAction {
    EDIT_TITLE = 'EDIT_TITLE',
    RESET_RECURRING = 'RESET_RECURRING',
    DELETE_RECURRING = 'DELETE_RECURRING'
}

const usePlanner = (datestamp: string, eventStorage: MMKV) => {
    const recurringPlannerStorage = useMMKV({ id: EStorageId.RECURRING_PLANNER });
    const plannerStorage = useMMKV({ id: EStorageId.PLANNER });

    const [planner, setPlanner] = useMMKVObject<TPlanner>(datestamp, plannerStorage);

    const {
        textfieldItem: focusedEvent,
        onCloseTextfield: onCloseFocusedEvent
    } = useTextfieldItemAs<IPlannerEvent>(eventStorage);

    const [isEditingTitle, setIsEditingTitle] = useState(false);

    const isPlannerFocused = planner && (focusedEvent?.listId === planner.datestamp);
    const hasStaleRecurring = planner && planner.deletedRecurringEventIds.length;
    const hasTitle = planner?.title?.length;

    const hasRecurring = !!planner?.eventIds.some((id) => {
        const event = getPlannerEventFromStorageById(id);
        return !!event.recurringId;
    });

    // Build the initial planner with recurring data.
    useEffect(() => {
        setPlanner((prev) => {
            const newPlanner = prev ?? createEmptyPlanner(datestamp);
            return upsertRecurringEventsIntoPlanner(newPlanner);
        });
    }, [datestamp]);

    // Upsert recurring events every time the day of week's recurring planner changes.
    useMMKVListener((key) => {
        if (key === getDayOfWeekFromDatestamp(datestamp)) {
            setPlanner((prev) => {
                let newPlanner = prev ?? createEmptyPlanner(datestamp);
                return upsertRecurringEventsIntoPlanner(newPlanner);
            });
        }
    }, recurringPlannerStorage);

    // =====================
    // 1. Exposed Functions
    // =====================

    function handleEditTitle(title: string) {
        setPlanner((prev) => {
            let newPlanner = prev ?? createEmptyPlanner(datestamp);
            return { ...newPlanner, title }
        });
    }

    function handleToggleEditTitle() {
        setIsEditingTitle(prev => !prev);
    }

    function handleUpdatePlannerEventIndexWithChronologicalCheck(index: number, event: IPlannerEvent) {
        setPlanner((prev) => {
            const newPlanner = prev ?? createEmptyPlanner(datestamp);
            return updatePlannerEventIndexWithChronologicalCheck(newPlanner, index, event);
        });
    }

    // ====================
    // 2. Helper Functions
    // ====================

    function triggerPlannerAction(action: EPlannerEditAction) {
        switch (action) {
            case EPlannerEditAction.EDIT_TITLE:
                handleToggleEditTitle();
                break;
            case EPlannerEditAction.DELETE_RECURRING:
                deleteAllRecurringEvents();
                break;
            case EPlannerEditAction.RESET_RECURRING:
                resetRecurringEvents();
                break;
        }
    }

    function resetRecurringEvents() {
        setPlanner((prev) => {
            const newPlanner = prev ?? createEmptyPlanner(datestamp);
            return upsertRecurringEventsIntoPlanner({
                ...newPlanner,
                deletedRecurringEventIds: []
            });
        });
    }

    function deleteAllRecurringEvents() {
        setPlanner((prev) => {
            const newPlanner = prev ?? createEmptyPlanner(datestamp);

            const recurringPlannerId = getDayOfWeekFromDatestamp(datestamp);
            const recurringPlanner = getRecurringPlannerFromStorageById(recurringPlannerId);

            // Delete all recurring event records and remove their IDs from the planner.
            newPlanner.eventIds = newPlanner.eventIds.filter((id) => {
                const event = getPlannerEventFromStorageById(id);
                if (event.recurringId) {
                    deletePlannerEventFromStorageById(event.id);
                    return false;
                }
                return true;
            });

            // Mark all the recurring event IDs as deleted.
            newPlanner.deletedRecurringEventIds = recurringPlanner.eventIds;

            return newPlanner;
        });
    }

    // ====================
    // 3. Overflow Actions
    // ====================

    const overflowActions = useOverflowActions([
        {
            id: EPlannerEditAction.EDIT_TITLE,
            title: `${hasTitle ? 'Edit' : 'Add'} Planner Title`,
            image: hasTitle ? 'pencil' : 'plus',
        },
        {
            id: 'recurring',
            title: 'Manage Recurring',
            image: 'repeat',
            subactions: [
                {
                    id: EPlannerEditAction.RESET_RECURRING,
                    title: 'Reset Recurring',
                    subtitle: 'Customized recurring events will be reset.',
                    image: 'arrow.trianglehead.2.clockwise',
                    attributes: {
                        hidden: !hasStaleRecurring
                    }
                },
                {
                    id: EPlannerEditAction.DELETE_RECURRING,
                    title: 'Delete Recurring',
                    attributes: {
                        destructive: true,
                        hidden: !hasRecurring
                    },
                    image: 'trash',
                }
            ],
        }
    ]);

    const OverflowIcon = () => {
        return (
            <MenuView
                title={`${getDayOfWeekFromDatestamp(datestamp)}, ${getMonthDateFromDatestamp(datestamp)}`}
                onPressAction={({ nativeEvent }) => {
                    triggerPlannerAction(nativeEvent.event as EPlannerEditAction);
                }}
                actions={overflowActions}
                shouldOpenOnLongPress={false}
            >
                <GenericIcon size='l' type='more' platformColor='systemBlue' />
            </MenuView>
        )
    };

    return {
        planner: planner ?? createEmptyPlanner(datestamp),
        isEditingTitle,
        isPlannerFocused,
        OverflowIcon,
        onCloseTextfield: onCloseFocusedEvent,
        onEditTitle: handleEditTitle,
        onToggleEditTitle: handleToggleEditTitle,
        onUpdatePlannerEventIndexWithChronologicalCheck: handleUpdatePlannerEventIndexWithChronologicalCheck,
    }
};

export default usePlanner;