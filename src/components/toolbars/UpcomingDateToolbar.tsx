import useTextfieldItemAs from "@/hooks/useTextfieldItemAs";
import { EStorageId } from "@/lib/enums/EStorageId";
import { IUpcomingDate } from "@/lib/types/listItems/IUpcomingDate";
import { datestampToMidnightJsDate, getDatestampThreeYearsFromToday, getTodayDatestamp, isoToDatestamp } from "@/utils/dateUtils";
import { useAtom, useAtomValue } from "jotai";
import { DateTime } from "luxon";
import { useEffect, useMemo, useRef } from "react";
import { Alert, View } from "react-native";
import { useMMKV, useMMKVObject } from "react-native-mmkv";
import DateTimePickerModal from "react-native-modal-datetime-picker";

import { mountedDatestampsAtom } from "@/atoms/mountedDatestamps";
import { upcomingDateDateModalEventAtom } from "@/atoms/upcomingDateDateModalEventAtom";
import { EStorageKey } from "@/lib/enums/EStorageKey";
import IconButton from "../icons/IconButton";
import ListToolbar from "../lists/ListToolbar";
import { saveUpcomingDatePlannerToStorage, saveUpcomingDateEventToStorage } from "@/storage/upcomingDateStorage";
import { updateDeviceCalendarEventByUpcomingDateEvent, deleteUpcomingDateAndReloadCalendar, updateUpcomingDateEventIndexWithChronologicalCheck } from "@/utils/upcomingDateUtils";
import { importantCalendarAtom, primaryCalendarAtom } from "@/atoms/calendarAtoms";
import debounce from "lodash.debounce";
import * as Calendar from 'expo-calendar';

// ✅ 

const UpcomingDateToolbar = () => {
    const upcomingDateEventStorage = useMMKV({ id: EStorageId.UPCOMING_DATE_EVENT });
    const upcomingDatePlannerStorage = useMMKV({ id: EStorageId.UPCOMING_DATE_PLANNER });

    const [upcomingDateDateModalEvent, setUpcomingDateDateModalEvent] = useAtom(upcomingDateDateModalEventAtom);
    const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);
    const primaryCalendar = useAtomValue(primaryCalendarAtom);
    const importantCalendar = useAtomValue(importantCalendarAtom);

    // This is the ID of the calendar where the event currently resides
    const deviceCalendarIdRef = useRef<string | null>(null);

    const todayMidnight = useMemo(() => datestampToMidnightJsDate(todayDatestamp), [todayDatestamp]);

    const [upcomingDatePlanner] = useMMKVObject<string[]>(EStorageKey.UPCOMING_DATE_LIST_KEY, upcomingDatePlannerStorage);

    const {
        textfieldItem: focusedUpcomingDate,
        onCloseTextfield: onCloseFocusedUpcomingDate
    } = useTextfieldItemAs<IUpcomingDate>(upcomingDateEventStorage);

    // Debounce the device calendar update for the event flag toggle.
    const handleChangeEventCalendarDebounce = useMemo(
        () =>
            debounce((newEvent: IUpcomingDate) => {
                if (deviceCalendarIdRef.current !== newEvent.calendarId) {
                    changeEventCalendar(newEvent);
                }
            }, 2000),
        []
    );

    // const handleChangeEventTitleDebounce = useMemo(
    //     () =>
    //         debounce((latestItem: T) => {
    //             onSaveToExternalStorage?.(latestItem);
    //         }, 1000),
    //     []
    // );

    // Track the event's device calendar ID.
    useEffect(() => {
        if (focusedUpcomingDate) {
            deviceCalendarIdRef.current = focusedUpcomingDate.calendarId;
        }
    }, [focusedUpcomingDate?.id]);

    function changeUpcomingDateEventDate(date: Date) {
        if (!upcomingDateDateModalEvent || !upcomingDatePlanner) return;

        const selected = DateTime.fromJSDate(date).startOf('day');
        const newUpcomingDate = {
            ...upcomingDateDateModalEvent,
            startIso: selected.toUTC().toISO()!
        };

        const currentIndex = upcomingDatePlanner.indexOf(newUpcomingDate.id);
        if (currentIndex < 0) {
            closeDateModal();
            return;
        };

        saveUpcomingDatePlannerToStorage(
            updateUpcomingDateEventIndexWithChronologicalCheck(upcomingDatePlanner, currentIndex, newUpcomingDate)
        );
        saveUpcomingDateEventToStorage(newUpcomingDate);

        // Save the modified event to the calendar.
        updateDeviceCalendarEventByUpcomingDateEvent(newUpcomingDate, isoToDatestamp(upcomingDateDateModalEvent.startIso));

        closeDateModal();
    }

    function toggleEventImportance() {
        if (!focusedUpcomingDate || !primaryCalendar || !importantCalendar) return;

        const isCurrentlyImportant = focusedUpcomingDate.calendarId === importantCalendar.id;
        const targetCalendar = isCurrentlyImportant ? primaryCalendar : importantCalendar;

        const updatedEvent: IUpcomingDate = {
            ...focusedUpcomingDate,
            calendarId: targetCalendar.id,
            color: targetCalendar.color,
        };

        // Save to storage immediately.
        saveUpcomingDateEventToStorage(updatedEvent);

        // Trigger debounced save to device calendar.
        handleChangeEventCalendarDebounce(updatedEvent);
    }

    // TODO: check moving event before it is added to calendar. -> makes a duplicate!
    // will the event be up to date?

    // what about editing event value before the calendar has changed?

    async function changeEventCalendar(event: IUpcomingDate) {
        const newEvent = { ...event };

        if (newEvent.calendarEventId) {
            // Delete from old calendar.
            await Calendar.deleteEventAsync(newEvent.calendarEventId);
            delete newEvent.calendarEventId;
        }

        // Create the event in the new calendar.
        await updateDeviceCalendarEventByUpcomingDateEvent(newEvent);
        deviceCalendarIdRef.current = newEvent.calendarId;
    }

    function openDateModal() {
        if (!focusedUpcomingDate) return;

        const modalEvent = { ...focusedUpcomingDate };

        if (modalEvent.value.trim() === '') {
            modalEvent.value = 'Upcoming Date';
        }

        saveUpcomingDateEventToStorage(modalEvent);
        setUpcomingDateDateModalEvent(modalEvent);
    }

    function closeDateModal() {
        setUpcomingDateDateModalEvent(null);
    }

    return (
        <View>
            <DateTimePickerModal
                mode='date'
                display='inline'
                isVisible={!!upcomingDateDateModalEvent}
                date={
                    upcomingDateDateModalEvent?.startIso
                        ? DateTime.fromISO(upcomingDateDateModalEvent.startIso).toJSDate()
                        : todayMidnight
                }
                onLayout={onCloseFocusedUpcomingDate}
                confirmTextIOS={`Schedule "${upcomingDateDateModalEvent?.value}"`}
                minimumDate={datestampToMidnightJsDate(getTodayDatestamp())}
                maximumDate={datestampToMidnightJsDate(getDatestampThreeYearsFromToday())}
                onCancel={closeDateModal}
                onConfirm={changeUpcomingDateEventDate}
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
                            onCloseFocusedUpcomingDate();
                            Alert.alert(
                                `Delete "${focusedUpcomingDate?.value}"?`,
                                `${focusedUpcomingDate?.isRecurring ? ' All future events' : 'The event'} in your calendar will also be deleted.`,
                                [
                                    {
                                        text: 'Cancel',
                                        style: 'cancel'
                                    },
                                    {
                                        text: 'Delete',
                                        style: 'destructive',
                                        onPress: async () => {
                                            if (!focusedUpcomingDate) return;
                                            await deleteUpcomingDateAndReloadCalendar(focusedUpcomingDate);
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
                )],
                [(
                    <IconButton
                        name={focusedUpcomingDate?.calendarId === primaryCalendar?.id ? 'flag' : 'flag.fill'}
                        color={focusedUpcomingDate?.calendarId === primaryCalendar?.id ? 'label' : 'systemRed'}
                        onClick={toggleEventImportance}
                    />
                )]
            ]}
            />
        </View>
    )
};

export default UpcomingDateToolbar;