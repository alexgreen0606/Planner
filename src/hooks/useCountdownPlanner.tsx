import { mountedDatestampsAtom } from "@/atoms/mountedDatestamps";
import { IToolbarIconConfig } from "@/components/lists/components/ListToolbar";
import { EStorageId } from "@/lib/enums/EStorageId";
import { EStorageKey } from "@/lib/enums/EStorageKey";
import { ICountdownEvent } from "@/lib/types/listItems/ICountdownEvent";
import { getCountdownEventFromStorageById, saveCountdownEventToStorage } from "@/storage/countdownStorage";
import { deleteCountdownAndReloadCalendar, getAllCountdownEventsFromCalendar, updateCountdownEventIndexWithChronologicalCheck, upsertCalendarEventsIntoCountdownPlanner } from "@/utils/countdownUtils";
import { datestampToMidnightJsDate, getDatestampThreeYearsFromToday, getTodayDatestamp } from "@/utils/dateUtils";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { uuid } from "expo-modules-core";
import { useAtomValue } from "jotai";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { MMKV, useMMKV, useMMKVObject } from "react-native-mmkv";
import useTextfieldItemAs from "./useTextfieldItemAs";
import { TIconType } from "@/lib/constants/icons";

// ✅ 

const useCountdownPlanner = (countdownEventStorage: MMKV) => {
    const countdownPlannerStorage = useMMKV({ id: EStorageId.COUNTDOWN_PLANNER });

    const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);

    const [countdownPlanner, setCountdownPlanner] = useMMKVObject<string[]>(EStorageKey.COUNTDOWN_LIST_KEY, countdownPlannerStorage);

    const [isLoading, setIsLoading] = useState(true);

    const todayMidnight = useMemo(() => datestampToMidnightJsDate(todayDatestamp), [todayDatestamp]);

    const {
        textfieldItem: focusedCountdown,
        onSetTextfieldItem: onSetFocusedCountdown,
        onSetTextfieldId,
        onCloseTextfield
    } = useTextfieldItemAs<ICountdownEvent>(countdownEventStorage);

    // Load in the calendar data on mount.
    useEffect(() => {
        const loadInCalendarCountdowns = async () => {
            const calendarEvents = await getAllCountdownEventsFromCalendar();
            setCountdownPlanner((prev) => {
                const initialIds = prev ?? [];
                return upsertCalendarEventsIntoCountdownPlanner(initialIds, calendarEvents);
            });
            setIsLoading(false);
        }

        loadInCalendarCountdowns();
    }, []);

    // =====================
    // 1. Exposed Functions
    // =====================

    function handleCreateCountdownEventInStorageAndFocusTextfield(index: number) {
        let startIso = DateTime.fromJSDate(todayMidnight).toISO()!;

        // Set the item to have the same date as the event above it.
        if (index !== 0) {
            const parentEventId = countdownPlanner![index - 1];
            const parentEvent = getCountdownEventFromStorageById(parentEventId);
            startIso = parentEvent.startIso;
        }

        const newCountdownEvent = {
            id: uuid.v4(),
            value: '',
            listId: EStorageKey.COUNTDOWN_LIST_KEY,
            storageId: EStorageId.COUNTDOWN_EVENT,
            startIso
        };
        saveCountdownEventToStorage(newCountdownEvent);

        // Add the event to its planner.
        setCountdownPlanner((prev) => {
            const newCountdownPlanner = prev ? [...prev] : [];
            newCountdownPlanner.splice(index, 0, newCountdownEvent.id);
            return newCountdownPlanner;
        });

        onSetTextfieldId(newCountdownEvent.id);
    }

    function handleUpdateCountdownEventIndexWithChronologicalCheck(index: number, event: ICountdownEvent) {
        setCountdownPlanner((prev) => {
            const newPlanner = prev ?? [];
            return updateCountdownEventIndexWithChronologicalCheck(newPlanner, index, event);
        });
    }

    // ===================
    // 2. Helper Function
    // ===================

    function handleDateSelect(event: DateTimePickerEvent) {
        if (!focusedCountdown) return;

        const { timestamp } = event.nativeEvent;
        const selected = DateTime.fromMillis(timestamp).startOf('day');

        onSetFocusedCountdown((prev) => prev ? ({
            ...prev,
            startIso: selected.toUTC().toISO()!
        }) : prev);
    }

    // ==================
    // 3. Toolbar Config
    // ==================

    const toolbarIcons: IToolbarIconConfig<ICountdownEvent>[][] = [
        [{
            type: 'trash' as TIconType,
            onClick: () => {
                onCloseTextfield();
                Alert.alert(
                    `Delete "${focusedCountdown?.value}"?`,
                    'The event in your calendar will also be deleted.',
                    [
                        {
                            text: 'Cancel',
                            style: 'cancel'
                        },
                        {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                                if (!focusedCountdown) return;
                                await deleteCountdownAndReloadCalendar(focusedCountdown);
                            }
                        }
                    ]
                );
            }
        }],
        [{
            type: 'calendar' as TIconType,
            customIcon: (
                <DateTimePicker
                    mode='date'
                    value={
                        focusedCountdown
                            ? DateTime.fromISO(focusedCountdown.startIso).toJSDate()
                            : todayMidnight
                    }
                    onChange={handleDateSelect}
                    minimumDate={datestampToMidnightJsDate(getTodayDatestamp())}
                    maximumDate={datestampToMidnightJsDate(getDatestampThreeYearsFromToday())}
                />
            )
        }]];

    return {
        toolbarIcons,
        countdownEventIds: countdownPlanner ?? [],
        isLoading,
        onCreateCountdownEventInStorageAndFocusTextfield: handleCreateCountdownEventInStorageAndFocusTextfield,
        onUpdateCountdownEventIndexWithChronologicalCheck: handleUpdateCountdownEventIndexWithChronologicalCheck
    }
};

export default useCountdownPlanner;