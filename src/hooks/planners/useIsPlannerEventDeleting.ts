import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { useDeleteSchedulerContext } from '@/providers/DeleteScheduler';
import { getTodayDatestamp } from '@/utils/dateUtils';

const useIsPlannerEventDeleting = (item?: IPlannerEvent) => {
  const { onGetDeletingItemsByStorageIdCallback: onGetDeletingItems } =
    useDeleteSchedulerContext<IPlannerEvent>();
  return item
    ? onGetDeletingItems(EStorageId.PLANNER_EVENT).some(
        (deleteItem) =>
          // The deleting item's ID matches the item ID
          (deleteItem.id === item.id || // OR the deleting item's calendar ID mathces the item's ID
            (deleteItem.calendarEventId && deleteItem.calendarEventId === item.calendarEventId)) && // AND
          // The item is from today
          (item.listId === getTodayDatestamp() ||
            // OR the deleting item is NOT from today
            deleteItem.listId !== getTodayDatestamp())
      )
    : false;
};

export default useIsPlannerEventDeleting;
