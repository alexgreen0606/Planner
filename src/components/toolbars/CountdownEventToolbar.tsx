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

import { countdownDateModalEventAtom } from "@/atoms/countdownDateModalEvent";
import { mountedDatestampsAtom } from "@/atoms/mountedDatestamps";
import { EStorageKey } from "@/lib/enums/EStorageKey";
import { saveCountdownEventToStorage, saveCountdownPlannerToStorage } from "@/storage/countdownStorage";
import IconButton from "../icons/IconButton";
import ListToolbar from "../lists/ListToolbar";

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

        const modalEvent = { ...focusedCountdown };

        if (modalEvent.value.trim() === '') {
            modalEvent.value = 'New Countdown Event';
        }

        saveCountdownEventToStorage(modalEvent);
        setCountdownDateModalEvent(modalEvent);
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
                onLayout={onCloseFocusedCountdown}
                confirmTextIOS={`Schedule "${countdownDateModalEvent?.value}"`}
                minimumDate={datestampToMidnightJsDate(getTodayDatestamp())}
                maximumDate={datestampToMidnightJsDate(getDatestampThreeYearsFromToday())}
                onCancel={closeDateModal}
                onConfirm={changeCountdownEventDate}
                pickerStyleIOS={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    display: 'flex'
                }}
            />
            <ListToolbar iconSet={[
                [(
                    <IconButton
                        name='trash'
                        color="label"
                        onClick={() => {
                            onCloseFocusedCountdown();
                            Alert.alert(
                                `Delete "${focusedCountdown?.value}"?`,
                                `${focusedCountdown?.isRecurring ? ' All future events' : 'The event'} in your calendar will also be deleted.`,
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
                    <IconButton
                        name='calendar'
                        color="label"
                        onClick={openDateModal}
                    />
                )]
            ]}
            />
        </View>
    )
};

export default CountdownEventToolbar;