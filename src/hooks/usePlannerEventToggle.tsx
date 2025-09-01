import GenericIcon from "@/components/icon";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { useDeleteSchedulerContext } from "@/providers/DeleteScheduler";
import useIsPlannerEventDeleting from "./useIsPlannerEventDeleting";

const useGetPlannerEventToggle = (item: IPlannerEvent) => {
    const { onToggleScheduleItemDeleteCallback: onToggleScheduleItemDelete } = useDeleteSchedulerContext<IPlannerEvent>();
    const isDeleting = useIsPlannerEventDeleting(item);
    return (
        <GenericIcon
            type={isDeleting ? 'circleFilled' : 'circle'}
            platformColor={isDeleting ? 'tertiaryLabel' : 'secondaryLabel'}
            onClick={() => onToggleScheduleItemDelete(item)}
        />
    )
};

export default useGetPlannerEventToggle;