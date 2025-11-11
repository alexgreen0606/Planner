import ListItemToggleButton from '@/components/buttons/ListItemToggleButton';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { useDeleteSchedulerContext } from '@/providers/DeleteScheduler';

import useIsPlannerEventDeleting from './useIsPlannerEventDeleting';

const useGetPlannerEventToggle = (item: IPlannerEvent) => {
  const { onToggleScheduleItemDeleteCallback } =
    useDeleteSchedulerContext<IPlannerEvent>();
  const isDeleting = useIsPlannerEventDeleting(item);
  return (
    <ListItemToggleButton
      isDeleting={isDeleting}
      onToggle={() => onToggleScheduleItemDeleteCallback(item)}
    />
  );
};

export default useGetPlannerEventToggle;
