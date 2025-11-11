import { useMMKV, useMMKVObject } from 'react-native-mmkv';

import ActionList from '@/components/ActionList';
import { NULL } from '@/lib/constants/generic';
import { EPopupActionType } from '@/lib/enums/EPopupActionType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TPlanner } from '@/lib/types/planners/TPlanner';
import { TPlannerPageParams } from '@/lib/types/routeParams/TPlannerPageParams';
import {
  deletePlannerEventFromStorageById,
  getPlannerEventFromStorageById
} from '@/storage/plannerStorage';
import { getRecurringPlannerFromStorageById } from '@/storage/recurringPlannerStorage';
import { getDayOfWeekFromDatestamp } from '@/utils/dateUtils';
import { createEmptyPlanner, upsertRecurringEventsIntoPlanner } from '@/utils/plannerUtils';

enum EPlannerEditAction {
  RESET_RECURRING = 'RESET_RECURRING',
  DELETE_RECURRING = 'DELETE_RECURRING'
}

const PlannerActions = ({ datestamp }: TPlannerPageParams) => {
  const plannerStorage = useMMKV({ id: EStorageId.PLANNER });
  const [planner, setPlanner] = useMMKVObject<TPlanner>(datestamp ?? NULL, plannerStorage);

  function handleAction(action: EPlannerEditAction) {
    switch (action) {
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

  const hasStaleRecurring = planner && planner.deletedRecurringEventIds.length;
  const hasRecurring = planner?.eventIds.some((id) => {
    const event = getPlannerEventFromStorageById(id);
    return !!event.recurringId;
  });

  return (
    <ActionList
      wrapButton
      actions={[
        {
          type: EPopupActionType.SUBMENU,
          title: 'Manage Recurring',
          systemImage: 'repeat',
          items: [
            {
              type: EPopupActionType.BUTTON,
              title: 'Reset Recurring',
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
          ]
        }
      ]}
    />
  );
};

export default PlannerActions;
