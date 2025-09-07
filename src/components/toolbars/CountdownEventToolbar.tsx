import useTextfieldItemAs from "@/hooks/useTextfieldItemAs";
import { EStorageId } from "@/lib/enums/EStorageId";
import { ICountdownEvent } from "@/lib/types/listItems/ICountdownEvent";
import { deleteCountdownAndReloadCalendar, updateCountdownEventIndexWithChronologicalCheck, updateDeviceCalendarEventByCountdownEvent } from "@/utils/countdownUtils";
import { datestampToMidnightJsDate, getDatestampThreeYearsFromToday, getTodayDatestamp, isoToDatestamp } from "@/utils/dateUtils";
import { useAtom, useAtomValue } from "jotai";
import { DateTime } from "luxon";
import { useMemo } from "react";
import { Alert, View } from "react-native";
import { useMMKV, useMMKVObject } from "react-native-mmkv";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import GenericIcon from "../icon";

import { countdownDateModalEventAtom } from "@/atoms/countdownDateModalEvent";
import { mountedDatestampsAtom } from "@/atoms/mountedDatestamps";
import { EStorageKey } from "@/lib/enums/EStorageKey";
import { saveCountdownEventToStorage, saveCountdownPlannerToStorage } from "@/storage/countdownStorage";
import ListToolbar from "../lists/components/ListToolbar";

// ✅ 

const CountdownEventToolbar = () => {
    const countdownEventStorage = useMMKV({ id: EStorageId.COUNTDOWN_EVENT });
    const countdownPlannerStorage = useMMKV({ id: EStorageId.COUNTDOWN_PLANNER });

    const [countdownDateModalEvent, setCountdownDateModalEvent] = useAtom(countdownDateModalEventAtom);
    const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);

    const todayMidnight = useMemo(() => datestampToMidnightJsDate(todayDatestamp), [todayDatestamp]);

    const [countdownPlanner] = useMMKVObject<string[]>(EStorageKey.COUNTDOWN_LIST_KEY, countdownPlannerStorage);

    const {
        textfieldItem: focusedCountdown,
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
            <GenericIcon
                type='calendar'
                onClick={openDateModal}
            />
        )]
    ];

    function changeCountdownEventDate(date: Date) {
        if (!countdownDateModalEvent || !countdownPlanner) return;

        const selected = DateTime.fromJSDate(date).startOf('day');

        const newCountdown = {
            ...countdownDateModalEvent,
            startIso: selected.toUTC().toISO()!
        };

        const currentIndex = countdownPlanner.indexOf(newCountdown.id);
        if (currentIndex < 0) {
            closeDateModal();
            return;
        };

        saveCountdownPlannerToStorage(
            updateCountdownEventIndexWithChronologicalCheck(countdownPlanner, currentIndex, newCountdown)
        );
        saveCountdownEventToStorage(newCountdown);

        // Save the modified event to the calendar.
        updateDeviceCalendarEventByCountdownEvent(newCountdown, isoToDatestamp(countdownDateModalEvent.startIso));

        closeDateModal();
    }

    function openDateModal() {
        if (!focusedCountdown) return;
        setCountdownDateModalEvent(focusedCountdown);
    }

    function closeDateModal() {
        setCountdownDateModalEvent(null);
    }

    return (
        <View>
            <DateTimePickerModal
                mode='date'
                display='inline'
                isVisible={!!countdownDateModalEvent}
                date={
                    countdownDateModalEvent?.startIso
                        ? DateTime.fromISO(countdownDateModalEvent.startIso).toJSDate()
                        : todayMidnight
                }
                confirmTextIOS={`Schedule "${countdownDateModalEvent?.value}"`}
                minimumDate={datestampToMidnightJsDate(getTodayDatestamp())}
                maximumDate={datestampToMidnightJsDate(getDatestampThreeYearsFromToday())}
                onLayout={onCloseFocusedCountdown}
                onCancel={closeDateModal}
                onConfirm={changeCountdownEventDate}
                pickerStyleIOS={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    display: 'flex'
                }}
            />
            <ListToolbar
                hide={focusedCountdown?.storageId !== EStorageId.COUNTDOWN_EVENT}
                iconSet={iconSet}
            />
        </View>
    )
};

export default CountdownEventToolbar;