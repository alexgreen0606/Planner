import { Alert } from "react-native";
import GenericIcon from "../icon";
import { deleteCountdownAndReloadCalendar, updateCountdownEventIndexWithChronologicalCheck } from "@/utils/countdownUtils";
import { datestampToMidnightJsDate, getDatestampThreeYearsFromToday, getTodayDatestamp } from "@/utils/dateUtils";
import { DateTime } from "luxon";
import { ICountdownEvent } from "@/lib/types/listItems/ICountdownEvent";
import useTextfieldItemAs from "@/hooks/useTextfieldItemAs";
import { useMMKV, useMMKVObject } from "react-native-mmkv";
import { EStorageId } from "@/lib/enums/EStorageId";
import { useMemo } from "react";
import { useAtomValue } from "jotai";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { mountedDatestampsAtom } from "@/atoms/mountedDatestamps";
import { saveCountdownPlannerToStorage } from "@/storage/countdownStorage";
import { EStorageKey } from "@/lib/enums/EStorageKey";
import ListToolbar from "../lists/components/ListToolbar";

// ✅ 

const CountdownEventToolbar = () => {
    const countdownEventStorage = useMMKV({ id: EStorageId.COUNTDOWN_EVENT });
    const countdownPlannerStorage = useMMKV({ id: EStorageId.COUNTDOWN_PLANNER });

    const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);

    const todayMidnight = useMemo(() => datestampToMidnightJsDate(todayDatestamp), [todayDatestamp]);

    const [countdownPlanner] = useMMKVObject<string[]>(EStorageKey.COUNTDOWN_LIST_KEY, countdownPlannerStorage);

    const {
        textfieldItem: focusedCountdown,
        onSetTextfieldItem: onSetFocusedCountdown,
        onCloseTextfield: onCloseFocusedCountdown
    } = useTextfieldItemAs<ICountdownEvent>(countdownEventStorage);

    const iconSet = [
        [(
            <GenericIcon
                type='trash'
                platformColor="label"
                onClick={() => {
                    onCloseFocusedCountdown();
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
                }}
            />
        )],
        [(
            <DateTimePicker
                mode='date'
                value={
                    focusedCountdown
                        ? DateTime.fromISO(focusedCountdown.startIso).toJSDate()
                        : todayMidnight
                }
                onChange={changeFocusedEventDate}
                minimumDate={datestampToMidnightJsDate(getTodayDatestamp())}
                maximumDate={datestampToMidnightJsDate(getDatestampThreeYearsFromToday())}
            />
        )]
    ];

    function changeFocusedEventDate(event: DateTimePickerEvent) {
        if (!focusedCountdown) return;

        const { timestamp } = event.nativeEvent;
        const selected = DateTime.fromMillis(timestamp).startOf('day');

        onSetFocusedCountdown((prev) => {
            if (!prev || !countdownPlanner) return prev;

            const currentIndex = countdownPlanner.indexOf(prev.id);

            if (!currentIndex) return prev;

            const newCountdown = {
                ...prev,
                startIso: selected.toUTC().toISO()!
            };

            saveCountdownPlannerToStorage(
                updateCountdownEventIndexWithChronologicalCheck(countdownPlanner, currentIndex, newCountdown)
            );

            return newCountdown;
        });
    }

    return (
        <ListToolbar
            hide={focusedCountdown?.storageId !== EStorageId.COUNTDOWN_EVENT}
            iconSet={iconSet}
        />
    )
};

export default CountdownEventToolbar;