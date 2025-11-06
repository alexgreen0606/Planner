import { useMMKV, useMMKVObject } from 'react-native-mmkv';

import PopupList from '@/components/PopupList';
import { EPopupActionType } from '@/lib/enums/EPopupActionType';
import { ERecurringPlannerId } from '@/lib/enums/ERecurringPlannerKey';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IRecurringEvent } from '@/lib/types/listItems/IRecurringEvent';
import { TRecurringPlanner } from '@/lib/types/planner/TRecurringPlanner';
import {
  getRecurringEventFromStorageById,
  getRecurringPlannerFromStorageById
} from '@/storage/recurringPlannerStorage';
import {
  createEmptyRecurringPlanner,
  deleteRecurringEventsFromStorageHideWeekday,
  updateRecurringEventIndexWithChronologicalCheck,
  upsertWeekdayEventsToRecurringPlanner
} from '@/utils/recurringPlannerUtils';

// ✅

enum ERecurringPlannerEditAction {
  RESET_WEEKDAY = 'RESET_WEEKDAY',
  DELETE_WEEKDAY = 'DELETE_WEEKDAY',
  DELETE_ALL = 'DELETE_ALL'
}

const useRecurringPlanner = (recurringPlannerId: string) => {
  const recurringStorage = useMMKV({ id: EStorageId.RECURRING_PLANNER });

  const [recurringPlanner, setRecurringPlanner] = useMMKVObject<TRecurringPlanner>(
    recurringPlannerId,
    recurringStorage
  );

  function handleUpdateRecurringEventIndexWithChronologicalCheck(
    index: number,
    event: IRecurringEvent
  ) {
    setRecurringPlanner((prev) => {
      const newPlanner = prev ?? createEmptyRecurringPlanner(recurringPlannerId);
      return updateRecurringEventIndexWithChronologicalCheck(newPlanner, index, event);
    });
  }

  function handleAction(action: ERecurringPlannerEditAction) {
    if (!recurringPlanner) return;

    const allEvents = recurringPlanner.eventIds.map(getRecurringEventFromStorageById);

    switch (action) {
      case ERecurringPlannerEditAction.DELETE_ALL:
        deleteRecurringEventsFromStorageHideWeekday(allEvents);
        break;
      case ERecurringPlannerEditAction.DELETE_WEEKDAY:
        const allWeekdayEvents = allEvents.filter((e) => e.weekdayEventId);
        deleteRecurringEventsFromStorageHideWeekday(allWeekdayEvents);
        break;
      case ERecurringPlannerEditAction.RESET_WEEKDAY:
        setRecurringPlanner((prev) =>
          prev
            ? {
                ...prev,
                deletedWeekdayEventIds: []
              }
            : prev
        );
        const weekdayPlannerIds = getRecurringPlannerFromStorageById(ERecurringPlannerId.WEEKDAYS);
        const weekdayEvents = weekdayPlannerIds.eventIds.map(getRecurringEventFromStorageById);
        upsertWeekdayEventsToRecurringPlanner(weekdayEvents, recurringPlannerId);
        break;
    }
  }

  // ==================
  //  Overflow Actions
  // ==================

  const OverflowActionsIcon = () => (
    <PopupList
      actions={[
        {
          type: EPopupActionType.SUBMENU,
          title: 'Manage Weekday',
          systemImage: 'repeat',
          hidden: recurringPlannerId === ERecurringPlannerId.WEEKDAYS,
          items: [
            {
              type: EPopupActionType.BUTTON,
              onPress: () => handleAction(ERecurringPlannerEditAction.RESET_WEEKDAY),
              title: 'Reset Weekday',
              // subtitle: 'Customized weekday events will be reset.',
              systemImage: 'arrow.trianglehead.2.clockwise'
            },
            {
              type: EPopupActionType.BUTTON,
              onPress: () => handleAction(ERecurringPlannerEditAction.DELETE_WEEKDAY),
              title: 'Delete All Weekday',
              destructive: true,
              systemImage: 'trash'
            }
          ]
        },
        {
          type: EPopupActionType.BUTTON,
          onPress: () => handleAction(ERecurringPlannerEditAction.DELETE_ALL),
          title: 'Delete All Events',
          destructive: true,
          hidden: recurringPlanner?.eventIds.length === 0,
          systemImage: 'trash'
        }
      ]}
    />
  );

  return {
    eventIds: recurringPlanner?.eventIds ?? [],
    OverflowActionsIcon,
    onUpdateRecurringEventIndexWithChronologicalCheck:
      handleUpdateRecurringEventIndexWithChronologicalCheck
  };
};

export default useRecurringPlanner;
