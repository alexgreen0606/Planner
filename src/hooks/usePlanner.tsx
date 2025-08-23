import GenericIcon from "@/components/icon";
import { EStorageId } from "@/lib/enums/EStorageId";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { TPlanner } from "@/lib/types/planner/TPlanner";
import { deletePlannerEventFromStorageById, getPlannerEventFromStorageById } from "@/storage/plannerStorage";
import { getRecurringPlannerFromStorageById } from "@/storage/recurringPlannerStorage";
import { getDayOfWeekFromDatestamp, getMonthDateFromDatestamp, parseTimeValueFromText } from "@/utils/dateUtils";
import { createEmptyPlanner, createPlannerEventTimeConfig, updatePlannerEventIndexWithChronologicalCheck, upsertCalendarEventsIntoPlanner, upsertRecurringEventsIntoPlanner } from "@/utils/plannerUtils";
import { MenuView } from "@react-native-menu/menu";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { MMKV, useMMKV, useMMKVListener, useMMKVObject } from "react-native-mmkv";
import { useTextfieldItemAs } from "./textfields/useTextfieldItemAs";
import { useCalendarData } from "./useCalendarData";

// ✅ 

enum EPlannerEditAction {
    EDIT_TITLE = 'EDIT_TITLE',
    TOGGLE_HIDE_RECURRING = 'TOGGLE_HIDE_RECURRING',
    RESET_RECURRING = 'RESET_RECURRING',
    DELETE_RECURRING = 'DELETE_RECURRING'
}

const usePlanner = (datestamp: string, eventStorage: MMKV) => {
    const plannerStorage = useMMKV({ id: EStorageId.PLANNER });
    const recurringPlannerStorage = useMMKV({ id: EStorageId.RECURRING_PLANNER });

    const initialLoadComplete = useRef(false);

    const [planner, setPlanner] = useMMKVObject<TPlanner>(datestamp, plannerStorage);

    const [isEditingTitle, setIsEditingTitle] = useState(false);

    // TODO: separate into 2 functions so hideRecurring doesnt keep running (incorporate collapsed into this as well)
    const visibleEventIds = useMemo(() => {
        if (!planner) return [];

        if (!planner.hideRecurring) return planner.eventIds;

        return planner.eventIds.filter((id) => {
            const event = getPlannerEventFromStorageById(id);
            return !event.recurringId;
        });
    }, [planner?.eventIds, planner?.hideRecurring]);

    const { textfieldItem, onSetTextfieldItem, onCloseTextfield } = useTextfieldItemAs<IPlannerEvent>(eventStorage);

    const { calendarEvents } = useCalendarData(datestamp);

    const isRecurringHidden = planner?.hideRecurring;
    const isPlannerFocused = planner && (textfieldItem?.listId === planner.datestamp);
    const hasTitle = planner?.title?.length;

    // Build the initial planner with recurring and calendar data.
    useEffect(() => {
        setPlanner((prev) => {
            let newPlanner = prev ?? createEmptyPlanner(datestamp);

            newPlanner = upsertRecurringEventsIntoPlanner(newPlanner);
            newPlanner = upsertCalendarEventsIntoPlanner(newPlanner, calendarEvents);

            return planner;
        });
    }, [datestamp]);

    // Upsert the calendar events every time the date's calendar changes.
    useEffect(() => {
        if (!initialLoadComplete.current) {
            initialLoadComplete.current = true;
            return;
        }

        setPlanner((prev) => {
            let newPlanner = prev ?? createEmptyPlanner(datestamp);
            return upsertCalendarEventsIntoPlanner(newPlanner, calendarEvents);
        });
    }, [calendarEvents]);

    // Upsert recurring events every time the day of week's recurring planner changes.
    useMMKVListener((key) => {
        if (key === getDayOfWeekFromDatestamp(datestamp)) {
            setPlanner((prev) => {
                let newPlanner = prev ?? createEmptyPlanner(datestamp);
                return upsertRecurringEventsIntoPlanner(newPlanner);
            });
        }
    }, recurringPlannerStorage);

    // Reveal all recurring events when the planner is focused.
    useEffect(() => {
        if (isPlannerFocused && isRecurringHidden) {
            handleToggleHideAllRecurring();
        }
    }, [textfieldItem?.listId, isRecurringHidden]);

    function handleEditTitle(title: string) {
        setPlanner((prev) => {
            let newPlanner = prev ?? createEmptyPlanner(datestamp);
            return { ...newPlanner, title }
        });
    }

    function handleToggleEditTitle() {
        setIsEditingTitle(prev => !prev);
    }

    function handleToggleHideAllRecurring() {
        setPlanner((prev) => {
            const newPlanner = prev ?? createEmptyPlanner(datestamp);
            return { ...newPlanner, hideRecurring: prev ? !prev.hideRecurring : true }
        });
    }

    function handleResetRecurringEvents() {
        setPlanner((prev) => {
            const newPlanner = prev ?? createEmptyPlanner(datestamp);
            return upsertRecurringEventsIntoPlanner({
                ...newPlanner,
                deletedRecurringEventIds: [],
                hideRecurring: false
            });
        });
    }

    function handleDeleteAllRecurringEvents() {
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

    function handleUpdatePlannerEventIndexWithChronologicalCheck(index: number, event: IPlannerEvent) {
        setPlanner((prev) => {
            const newPlanner = prev ?? createEmptyPlanner(datestamp);
            return updatePlannerEventIndexWithChronologicalCheck(newPlanner, index, event);
        });
    }

    // Scan user input for an initial event time.
    // Delete recurring event and clone if needed.
    function handleUpdatePlannerEventValueWithTimeParsing(userInput: string) {
        onSetTextfieldItem((prev) => {
            if (!prev || !planner) return prev;

            const newEvent = { ...prev, value: userInput };
            let newPlanner = { ...planner };

            // Phase 1: If recurring, delete the event so it can be customized.
            if (newEvent.recurringId) {
                newPlanner.eventIds = newPlanner.eventIds.filter(id => id !== newEvent.id);
                newPlanner.deletedRecurringEventIds.push(newEvent.recurringId);
                delete newEvent.recurringId;
            }

            // Phase 2: Parse time from user input.
            const { formattedTime, updatedText } = parseTimeValueFromText(userInput);
            if (!formattedTime) return newEvent; // No time detected

            // Phase 3: Apply planner-specific time config.
            newEvent.value = updatedText;
            newEvent.timeConfig = createPlannerEventTimeConfig(newEvent.listId, formattedTime);

            // Phase 4: Check chronological order and update index
            const currentIndex = newPlanner.eventIds.findIndex(e => e === newEvent.id);
            if (currentIndex === -1) {
                throw new Error(`handleUpdatePlannerEventValueWithTimeParsing: No event exists in planner ${newEvent.listId} with ID ${newEvent.id}`);
            }

            // Update the event's position in the list if needed.
            setPlanner(
                updatePlannerEventIndexWithChronologicalCheck(newPlanner, currentIndex, newEvent)
            );

            return newEvent;
        });
    }

    function handleAction(action: EPlannerEditAction) {
        switch (action) {
            case EPlannerEditAction.EDIT_TITLE:
                handleToggleEditTitle();
                break;
            case EPlannerEditAction.DELETE_RECURRING:
                handleDeleteAllRecurringEvents();
                break;
            case EPlannerEditAction.RESET_RECURRING:
                handleResetRecurringEvents();
                break;
            case EPlannerEditAction.TOGGLE_HIDE_RECURRING:
                handleToggleHideAllRecurring();
            default:
                return;
        }
    }

    // -------- Overflow Actions --------

    const overflowActions = [
        {
            id: EPlannerEditAction.EDIT_TITLE,
            title: `${hasTitle ? 'Edit' : 'Add'} Planner Title`,
            titleColor: '#FFFFFF',
            image: Platform.select({
                ios: hasTitle ? 'pencil' : 'plus'
            }),
            imageColor: '#FFFFFF'
        },
        {
            id: 'recurring',
            title: 'Manage Recurring',
            titleColor: '#FFFFFF',
            subtitle: 'Hide, delete, and sync events.',
            image: Platform.select({
                ios: 'repeat'
            }),
            imageColor: '#FFFFFF',
            subactions: [
                {
                    id: EPlannerEditAction.TOGGLE_HIDE_RECURRING,
                    title: `${isRecurringHidden ? 'Show' : 'Hide'} Recurring`,
                    titleColor: 'rgba(250,180,100,0.5)',
                    image: Platform.select({
                        ios: isRecurringHidden ? 'eye' : 'eye.slash'
                    }),
                    imageColor: '#FFFFFF'
                },
                {
                    id: EPlannerEditAction.RESET_RECURRING,
                    title: 'Reset Recurring',
                    subtitle: 'Customized recurring events will be reset.',
                    titleColor: 'rgb(255,97,101)',
                    image: Platform.select({
                        ios: 'arrow.trianglehead.2.counterclockwise.rotate.90'
                    }),
                    imageColor: '#FFFFFF',
                },
                {
                    id: EPlannerEditAction.DELETE_RECURRING,
                    title: 'Delete Recurring',
                    attributes: {
                        destructive: true
                    },
                    image: Platform.select({
                        ios: 'trash'
                    }),
                    imageColor: 'rgb(255,66,69)'
                }
            ],
        }
    ];

    const OverflowIcon = () => {
        return (
            <MenuView
                title={`${getDayOfWeekFromDatestamp(datestamp)}, ${getMonthDateFromDatestamp(datestamp)}`}
                onPressAction={({ nativeEvent }) => {
                    handleAction(nativeEvent.event as EPlannerEditAction);
                }}
                actions={overflowActions}
                shouldOpenOnLongPress={false}
            >
                <GenericIcon size='l' type='more' platformColor='systemBlue' />
            </MenuView>
        )
    }

    return {
        planner: planner ?? createEmptyPlanner(datestamp),
        visibleEventIds,
        isEditingTitle,
        isPlannerFocused,
        OverflowIcon,
        onCloseTextfield,
        onEditTitle: handleEditTitle,
        onToggleEditTitle: handleToggleEditTitle,
        onUpdatePlannerEventIndexWithChronologicalCheck: handleUpdatePlannerEventIndexWithChronologicalCheck,
        onUpdatePlannerEventValueWithTimeParsing: handleUpdatePlannerEventValueWithTimeParsing,
    }
};

export default usePlanner;