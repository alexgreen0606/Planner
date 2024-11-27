import React from 'react';
import { View } from 'react-native';
import SortableList from '../../../foundation/lists/components/SortableList';
import DayBanner from './DayBanner';
import usePlanner from '../hooks/usePlanner';
import { Event } from '../types';
import useCreateEvent from '../hooks/useCreateEvent';
import useUpdateEvent from '../hooks/useUpdateEvent';
import { CreateItemPayload, ListItem } from '../../../foundation/lists/types';
import useDeleteEvent from '../hooks/useDeleteEvent';
import { usePlannersContext } from '../services/PlannersProvider';

interface PlannerProps {
    timestamp: string;
}

const Planner = ({timestamp}: PlannerProps) => {
    const { planner } = usePlanner(timestamp);
    const { createEvent } = useCreateEvent(timestamp);
    const { updateEvent } = useUpdateEvent();
    const { deleteEvent } = useDeleteEvent();
    const { isLoading } = usePlannersContext();

    if (!planner) return

    return (
        <View>
            <DayBanner timestamp={timestamp} />
            <SortableList<Event>
                listId={timestamp}
                createDbItem={(item: ListItem) => createEvent(item)}
                updateDbItem={(event: Event) => updateEvent({ event })}
                deleteDbItem={(event: Event) => deleteEvent({ event })}
                listItems={planner}
                isLoading={isLoading}
            />
        </View>
    );
};

export default Planner;