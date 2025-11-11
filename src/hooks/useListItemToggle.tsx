import ListItemToggleButton from '@/components/buttons/ListItemToggleButton';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { useDeleteSchedulerContext } from '@/providers/DeleteScheduler';

const useListItemToggle = <T extends TListItem>(item: T) => {
  const { onToggleScheduleItemDeleteCallback, onGetIsItemDeletingCallback } =
    useDeleteSchedulerContext<T>();
  const isDeleting = onGetIsItemDeletingCallback(item);
  return (
    <ListItemToggleButton
      isDeleting={isDeleting}
      onToggle={() => onToggleScheduleItemDeleteCallback(item)}
    />
  );
};

export default useListItemToggle;
