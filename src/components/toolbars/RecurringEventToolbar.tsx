import { useAtom } from 'jotai';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import { View } from 'react-native';
import { useMMKV } from 'react-native-mmkv';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import { recurringTimeModalEventAtom } from '@/atoms/recurring/recurringTimeModalEvent';
import useTextfieldItemAs from '@/hooks/useTextfieldItemAs';
import { ERecurringPlannerId } from '@/lib/enums/ERecurringPlannerKey';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IRecurringEvent } from '@/lib/types/listItems/IRecurringEvent';
import {
  getRecurringPlannerFromStorageById,
  saveRecurringEventToStorage,
  saveRecurringPlannerToStorage
} from '@/storage/recurringPlannerStorage';
import { getIsoFromNowTimeRoundedDown5Minutes } from '@/utils/dateUtils';
import {
  updateRecurringEventIndexWithChronologicalCheck,
  upsertWeekdayEventToRecurringPlanners
} from '@/utils/recurringPlannerUtils';

import IconButton from '../icons/IconButton';
import ListToolbar from '../lists/ListToolbar';

// ✅

const RecurringEventToolbar = () => {
  const recurringEventStorage = useMMKV({ id: EStorageId.RECURRING_PLANNER_EVENT });

  const [recurringTimeModalEvent, setRecurringTimeModalEvent] = useAtom(
    recurringTimeModalEventAtom
  );

  const {
    textfieldItem: focusedEvent,
    onSetTextfieldItem: onSetFocusedEvent,
    onCloseTextfield: onCloseFocusedEvent
  } = useTextfieldItemAs<IRecurringEvent>(recurringEventStorage);

  const focusedDate = useMemo(() => {
    if (recurringTimeModalEvent?.startTime) {
      const [hour, minute] = recurringTimeModalEvent.startTime.split(':').map(Number);
      const dateTime = DateTime.local().set({
        hour,
        minute,
        second: 0,
        millisecond: 0
      });
      return dateTime.toJSDate();
    } else {
      return DateTime.fromISO(getIsoFromNowTimeRoundedDown5Minutes()).toJSDate();
    }
  }, [recurringTimeModalEvent?.startTime]);

  function updateRecurringEventTimeWithChronologicalCheck(date: Date) {
    if (!recurringTimeModalEvent) return;

    const newEvent = { ...recurringTimeModalEvent };
    const newPlanner = getRecurringPlannerFromStorageById(recurringTimeModalEvent.listId);

    // If weekday recurring, delete the event so it can be customized.
    if (newEvent.weekdayEventId) {
      newPlanner.deletedWeekdayEventIds.push(newEvent.weekdayEventId);
      delete newEvent.weekdayEventId;
    }

    // Set the new time in the event.
    const selectedTime = DateTime.fromJSDate(date);
    newEvent.startTime = selectedTime.toFormat('HH:mm');

    const currentIndex = newPlanner.eventIds.indexOf(newEvent.id);
    if (currentIndex < 0) {
      closeTimeModal();
      return;
    }

    // Save the planner and event to storage.
    saveRecurringPlannerToStorage(
      updateRecurringEventIndexWithChronologicalCheck(newPlanner, currentIndex, newEvent)
    );
    saveRecurringEventToStorage(newEvent);

    if (newEvent.listId === ERecurringPlannerId.WEEKDAYS) {
      upsertWeekdayEventToRecurringPlanners(newEvent);
    }

    closeTimeModal();
  }

  function openTimeModal() {
    if (!focusedEvent) return;

    const modalEvent = { ...focusedEvent };

    if (modalEvent.value.trim() === '') {
      modalEvent.value = 'New Recurring Event';
    }

    saveRecurringEventToStorage(modalEvent);
    setRecurringTimeModalEvent(modalEvent);
  }

  function closeTimeModal() {
    setRecurringTimeModalEvent(null);
  }

  function deleteFocusedEventTime() {
    onSetFocusedEvent((prev) => {
      if (!prev) return prev;

      const newEvent = { ...prev };
      delete newEvent.startTime;
      return newEvent;
    });
  }

  return (
    <View>
      <DateTimePickerModal
        mode="time"
        confirmTextIOS={`Schedule "${recurringTimeModalEvent?.value}"`}
        isVisible={!!recurringTimeModalEvent}
        minuteInterval={5}
        date={focusedDate}
        onLayout={onCloseFocusedEvent}
        onCancel={closeTimeModal}
        onConfirm={updateRecurringEventTimeWithChronologicalCheck}
        pickerStyleIOS={{
          alignItems: 'center',
          justifyContent: 'center',
          display: 'flex'
        }}
      />
      <ListToolbar
        iconSet={[
          [
            <IconButton
              name="clock.badge.xmark"
              size={22}
              disabled={!focusedEvent?.startTime}
              color="label"
              onClick={deleteFocusedEventTime}
            />
          ],
          [
            <IconButton
              name="clock.arrow.trianglehead.2.counterclockwise.rotate.90"
              onClick={openTimeModal}
              color="label"
              size={22}
            />
          ]
        ]}
      />
    </View>
  );
};

export default RecurringEventToolbar;
