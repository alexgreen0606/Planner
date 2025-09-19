import PopupList from "@/components/OverflowActions";
import { EPopupActionType } from "@/lib/enums/EPopupActionType";
import { EStorageId } from "@/lib/enums/EStorageId";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { TPlanner } from "@/lib/types/planner/TPlanner";
import { deletePlannerEventFromStorageById, getPlannerEventFromStorageById } from "@/storage/plannerStorage";
import { getRecurringPlannerFromStorageById } from "@/storage/recurringPlannerStorage";
import { getDayOfWeekFromDatestamp } from "@/utils/dateUtils";
import { createEmptyPlanner, updatePlannerEventIndexWithChronologicalCheck, upsertRecurringEventsIntoPlanner } from "@/utils/plannerUtils";
import { useEffect, useState } from "react";
import { MMKV, useMMKV, useMMKVListener, useMMKVObject } from "react-native-mmkv";
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

    const hasRecurring = planner?.eventIds.some((id) => {
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

    // ===================
    //  Exposed Functions
    // ===================

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

    // ==================
    //  Helper Functions
    // ==================

    function handleAction(action: EPlannerEditAction) {
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

    // ==================
    //  Overflow Actions
    // ==================

    const OverflowActionsIcon = () => {
        return (
            <PopupList actions={[
                {
                    type: EPopupActionType.BUTTON,
                    title: `${hasTitle ? 'Edit' : 'Add'} Planner Title`,
                    systemImage: hasTitle ? 'pencil' : 'plus',
                    onPress: () => handleAction(EPlannerEditAction.EDIT_TITLE)
                },
                {
                    type: EPopupActionType.SUBMENU,
                    title: 'Manage Recurring',
                    systemImage: 'repeat',
                    items: [
                        {
                            type: EPopupActionType.BUTTON,
                            title: 'Reset Recurring',
                            // subtitle: 'Customized recurring events will be reset.',
                            systemImage: 'arrow.trianglehead.2.clockwise',
                            hidden: !hasStaleRecurring,
                            onPress: () => handleAction(EPlannerEditAction.RESET_RECURRING)
                        },
                        {
                            type: EPopupActionType.BUTTON,
                            title: 'Delete Recurring',
                            destructive: true,
                            hidden: !hasRecurring,
                            systemImage: 'trash',
                            onPress: () => handleAction(EPlannerEditAction.DELETE_RECURRING)
                        }
                    ],
                }
            ]} />
        )
    };

    return {
        planner: planner ?? createEmptyPlanner(datestamp),
        isEditingTitle,
        isPlannerFocused,
        OverflowActionsIcon,
        onCloseTextfield: onCloseFocusedEvent,
        onEditTitle: handleEditTitle,
        onToggleEditTitle: handleToggleEditTitle,
        onUpdatePlannerEventIndexWithChronologicalCheck: handleUpdatePlannerEventIndexWithChronologicalCheck,
    }
};

export default usePlanner;