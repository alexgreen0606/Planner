import { externalPlannerDataAtom } from "@/atoms/externalPlannerData";
import GenericIcon from "@/components/icon";
import { EStorageId } from "@/lib/enums/EStorageId";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { TPlanner } from "@/lib/types/planner/TPlanner";
import { deletePlannerEventFromStorageById, getPlannerEventFromStorageById } from "@/storage/plannerStorage";
import { getRecurringPlannerFromStorageById } from "@/storage/recurringPlannerStorage";
import { getDayOfWeekFromDatestamp, getMonthDateFromDatestamp, parseTimeValueFromText } from "@/utils/dateUtils";
import { createEmptyPlanner, createPlannerEventTimeConfig, updatePlannerEventIndexWithChronologicalCheck, upsertCalendarEventsIntoPlanner, upsertRecurringEventsIntoPlanner } from "@/utils/plannerUtils";
import { MenuView } from "@react-native-menu/menu";
import { useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { MMKV, useMMKV, useMMKVListener, useMMKVObject } from "react-native-mmkv";
import useCalendarData from "./useCalendarData";
import useTextfieldItemAs from "./useTextfieldItemAs";

// ✅ 

enum EPlannerEditAction {
    EDIT_TITLE = 'EDIT_TITLE',
    TOGGLE_HIDE_RECURRING = 'TOGGLE_HIDE_RECURRING',
    RESET_RECURRING = 'RESET_RECURRING',
    DELETE_RECURRING = 'DELETE_RECURRING'
}

const usePlanner = (datestamp: string, eventStorage: MMKV) => {
    const recurringPlannerStorage = useMMKV({ id: EStorageId.RECURRING_PLANNER });
    const plannerStorage = useMMKV({ id: EStorageId.PLANNER });

    const calendarEventData = useAtomValue(externalPlannerDataAtom);

    const [planner, setPlanner] = useMMKVObject<TPlanner>(datestamp, plannerStorage);

    const {
        textfieldItem: focusedEvent,
        onSetTextfieldItem: onSetFocusedEvent,
        onCloseTextfield: onCloseFocusedEvent
    } = useTextfieldItemAs<IPlannerEvent>(eventStorage);

    const [isEditingTitle, setIsEditingTitle] = useState(false);

    const isLoadingCalendarData = useMemo(
        () => calendarEventData.plannersMap[datestamp] === undefined,
        [calendarEventData]
    );

    // TODO: separate into 2 functions so hideRecurring doesnt keep running (incorporate collapsed into this as well)
    const visibleEventIds = useMemo(() => {
        if (!planner) return [];

        if (!planner.hideRecurring) return planner.eventIds;

        return planner.eventIds.filter((id) => {
            const event = getPlannerEventFromStorageById(id);
            return !event.recurringId;
        });
    }, [planner?.eventIds, planner?.hideRecurring]);

    const { calendarEvents } = useCalendarData(datestamp);

    const isRecurringHidden = planner?.hideRecurring;
    const isPlannerFocused = planner && (focusedEvent?.listId === planner.datestamp);
    const hasTitle = planner?.title?.length;

    // Build the initial planner with recurring data.
    useEffect(() => {
        setPlanner((prev) => {
            const newPlanner = prev ?? createEmptyPlanner(datestamp);
            return upsertRecurringEventsIntoPlanner(newPlanner);
        });
    }, [datestamp]);

    // Upsert the calendar events every time the date's calendar changes.
    useEffect(() => {
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
            toggleHideAllRecurring();
        }
    }, [focusedEvent?.listId, isRecurringHidden]);

    // =====================
    // 1. Exposed Functions
    // =====================

    function handleUpdatePlannerEventValueWithTimeParsing(userInput: string) {
        onSetFocusedEvent((prev) => {
            if (!prev || !planner) return prev;

            const newEvent = { ...prev, value: userInput };
            const newPlanner = { ...planner };

            // Phase 1: If recurring, delete the event so it can be customized.
            if (newEvent.recurringId) {
                newPlanner.eventIds = newPlanner.eventIds.filter(id => id !== newEvent.id);
                newPlanner.deletedRecurringEventIds.push(newEvent.recurringId);
                delete newEvent.recurringId;
            }

            // Don't scan for time values if the event is already timed.
            if (newEvent.timeConfig) return newEvent;

            // Phase 2: Parse time from user input.
            const { timeValue, updatedText } = parseTimeValueFromText(userInput);
            if (!timeValue) return newEvent;

            // Phase 3: Apply planner-specific time config.
            newEvent.value = updatedText;
            newEvent.timeConfig = createPlannerEventTimeConfig(newEvent.listId, timeValue);

            // Phase 4: Check chronological order and update index if needed.
            const currentIndex = newPlanner.eventIds.findIndex(e => e === newEvent.id);
            if (currentIndex === -1) {
                throw new Error(`handleUpdatePlannerEventValueWithTimeParsing: No event exists in planner ${newEvent.listId} with ID ${newEvent.id}`);
            }

            // Save the planner and the event to storage.
            setPlanner(
                updatePlannerEventIndexWithChronologicalCheck(newPlanner, currentIndex, newEvent)
            );
            return newEvent;
        });
    }

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
            case EPlannerEditAction.TOGGLE_HIDE_RECURRING:
                toggleHideAllRecurring();
            default:
                return;
        }
    }

    function toggleHideAllRecurring() {
        setPlanner((prev) => {
            const newPlanner = prev ?? createEmptyPlanner(datestamp);
            return { ...newPlanner, hideRecurring: prev ? !prev.hideRecurring : true }
        });
    }

    function resetRecurringEvents() {
        setPlanner((prev) => {
            const newPlanner = prev ?? createEmptyPlanner(datestamp);
            return upsertRecurringEventsIntoPlanner({
                ...newPlanner,
                deletedRecurringEventIds: [],
                hideRecurring: false
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
        visibleEventIds,
        isEditingTitle,
        isPlannerFocused,
        isLoading: isLoadingCalendarData,
        OverflowIcon,
        onCloseTextfield: onCloseFocusedEvent,
        onEditTitle: handleEditTitle,
        onToggleEditTitle: handleToggleEditTitle,
        onUpdatePlannerEventIndexWithChronologicalCheck: handleUpdatePlannerEventIndexWithChronologicalCheck,
        onUpdatePlannerEventValueWithTimeParsing: handleUpdatePlannerEventValueWithTimeParsing,
    }
};

export default usePlanner;