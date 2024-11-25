import React from 'react';
import { View } from 'react-native';
import SortableList from '../../../foundation/lists/components/SortableList';
import DayBanner from './DayBanner';
import usePlanner from '../hooks/usePlanner';
import { Event } from '../types';
import useCreateEvent from '../hooks/useCreateEvent';
import useUpdateEvent from '../hooks/useUpdateEvent';
import { CreateItemPayload } from '../../../foundation/lists/types';
import useDeleteEvent from '../hooks/useDeleteEvent';

interface PlannerProps {
    timestamp: string;
    currentOpenTextfield: string | undefined;
    handleUpdateCurrentListInEdit: (timestamp: string) => void;
}

const Planner = ({
    timestamp,
    currentOpenTextfield,
    handleUpdateCurrentListInEdit
}: PlannerProps) => {
    const { planner } = usePlanner(timestamp);
    const { createEvent } = useCreateEvent();
    const { updateEvent } = useUpdateEvent();
    const { deleteEvent } = useDeleteEvent();

    if (!planner) return

    return (
        <View>
            <DayBanner timestamp={timestamp} />
            <SortableList<Event>
                handleOpenTextfield={() => handleUpdateCurrentListInEdit(timestamp)}
                currentOpenTextfield={currentOpenTextfield}
                listId={timestamp}
                createDbItem={(payload: CreateItemPayload) => createEvent({ ...payload, timestamp })}
                updateDbItem={(event: Event) => updateEvent({ event })}
                deleteDbItem={(event: Event) => deleteEvent({ event })}
                listItems={planner}
            />
        </View>
    );
};

export default Planner;