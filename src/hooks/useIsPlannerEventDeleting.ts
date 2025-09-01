import { EStorageId } from "@/lib/enums/EStorageId";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { useDeleteSchedulerContext } from "@/providers/DeleteScheduler";
import { getTodayDatestamp } from "@/utils/dateUtils";

const useIsPlannerEventDeleting = (item?: IPlannerEvent) => {
    const { onGetDeletingItemsByStorageIdCallback: onGetDeletingItems } = useDeleteSchedulerContext<IPlannerEvent>();
    return item
        ? onGetDeletingItems(EStorageId.PLANNER_EVENT).some((deleteItem) =>
            (deleteItem.id === item.id || (deleteItem.calendarId && deleteItem.calendarId === item.calendarId)) &&
            deleteItem.listId !== getTodayDatestamp()
        )
        : false;
};

export default useIsPlannerEventDeleting;