import IconButton from "@/components/icons/IconButton";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { useDeleteSchedulerContext } from "@/providers/DeleteScheduler";
import useIsPlannerEventDeleting from "./useIsPlannerEventDeleting";
import ListItemToggleButton from "@/components/icons/customButtons/ListItemToggleButton";

// ✅ 

const useGetPlannerEventToggle = (item: IPlannerEvent) => {
    const { onToggleScheduleItemDeleteCallback: onToggleScheduleItemDelete } = useDeleteSchedulerContext<IPlannerEvent>();
    const isDeleting = useIsPlannerEventDeleting(item);
    return (
        <ListItemToggleButton
            isDeleting={isDeleting}
            onToggle={() => onToggleScheduleItemDelete(item)}
        />
    )
};

export default useGetPlannerEventToggle;