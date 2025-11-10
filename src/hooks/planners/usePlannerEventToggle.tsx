import ListItemToggleButton from '@/components/buttons/ListItemToggleButton';
import IconButton from '@/components/buttons/IconButton';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { useDeleteSchedulerContext } from '@/providers/DeleteScheduler';

import useIsPlannerEventDeleting from './useIsPlannerEventDeleting';

// ✅

const useGetPlannerEventToggle = (item: IPlannerEvent) => {
  const { onToggleScheduleItemDeleteCallback: onToggleScheduleItemDelete } =
    useDeleteSchedulerContext<IPlannerEvent>();
  const isDeleting = useIsPlannerEventDeleting(item);
  return (
    <ListItemToggleButton
      isDeleting={isDeleting}
      onToggle={() => onToggleScheduleItemDelete(item)}
    />
  );
};

export default useGetPlannerEventToggle;
