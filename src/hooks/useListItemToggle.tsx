import GenericIcon from "@/components/icon";
import { TListItem } from "@/lib/types/listItems/core/TListItem";
import { useDeleteSchedulerContext } from "@/providers/DeleteScheduler";

const useListItemToggle = <T extends TListItem>(item: T, disabled?: boolean) => {
    const { onToggleScheduleItemDeleteCallback, onGetIsItemDeletingCallback } = useDeleteSchedulerContext<T>();

    const isDeleting = onGetIsItemDeletingCallback(item);

    return (
        <GenericIcon
            type={isDeleting ? 'circleFilled' : 'circle'}
            platformColor={disabled || isDeleting ? 'tertiaryLabel' : 'secondaryLabel'}
            onClick={() => onToggleScheduleItemDeleteCallback(item)}
            size={22}
        />
    )
};

export default useListItemToggle;