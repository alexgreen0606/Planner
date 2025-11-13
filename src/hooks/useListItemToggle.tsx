import ListItemToggleButton from '@/components/buttons/ListItemToggleButton';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { useDeleteSchedulerContext } from '@/providers/DeleteScheduler';

const useListItemToggle = <T extends TListItem>(item: T, platformColor?: string ) => {
  const { onToggleScheduleItemDeleteCallback, onGetIsItemDeletingCallback } =
    useDeleteSchedulerContext<T>();
  const isDeleting = onGetIsItemDeletingCallback(item);
  return (
    <ListItemToggleButton
      isDeleting={isDeleting}
      platformColor={platformColor}
      onToggle={() => onToggleScheduleItemDeleteCallback(item)}
    />
  );
};

export default useListItemToggle;
