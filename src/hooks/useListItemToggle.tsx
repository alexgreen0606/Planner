import IconButton from "@/components/icons/IconButton";
import { TListItem } from "@/lib/types/listItems/core/TListItem";
import { useDeleteSchedulerContext } from "@/providers/DeleteScheduler";

const useListItemToggle = <T extends TListItem>(item: T, disabled?: boolean) => {
    const { onToggleScheduleItemDeleteCallback, onGetIsItemDeletingCallback } = useDeleteSchedulerContext<T>();

    const isDeleting = onGetIsItemDeletingCallback(item);

    return (
        <IconButton
            name={isDeleting ? 'circle.inset.filled' : 'circle'}
            disabled={disabled || isDeleting}
            color='secondaryLabel'
            onClick={() => onToggleScheduleItemDeleteCallback(item)}
            size={22}
        />
    )
};

export default useListItemToggle;