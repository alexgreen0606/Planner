import IconButton from "@/components/icons/IconButton";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { useDeleteSchedulerContext } from "@/providers/DeleteScheduler";
import useIsPlannerEventDeleting from "./useIsPlannerEventDeleting";

// ✅ 

const useGetPlannerEventToggle = (item: IPlannerEvent) => {
    const { onToggleScheduleItemDeleteCallback: onToggleScheduleItemDelete } = useDeleteSchedulerContext<IPlannerEvent>();
    const isDeleting = useIsPlannerEventDeleting(item);
    return (
        <IconButton
            name={isDeleting ? 'circle.inset.filled' : 'circle'}
            disabled={isDeleting}
            color='secondaryLabel'
            onClick={() => onToggleScheduleItemDelete(item)}
            size={22}
        />
    )
};

export default useGetPlannerEventToggle;