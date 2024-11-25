import { useApi } from '../../../foundation/api/hooks/useApi';
import { Event, EventPayload } from '../types';
import { generateEvent, generateEventPayload } from '../utils';

interface DeleteEventPayload {
    event: Event;
}

const useDeleteEvent = () => {
    const { error, loading, fetchData } = useApi<DeleteEventPayload, EventPayload, EventPayload, Event>({
        api: 'backend',
        endpoint: '/deleteEvent',
        method: 'DELETE',
        formatPayload: (payload: DeleteEventPayload) => (generateEventPayload(payload.event)),
        formatResponse: (response) => generateEvent(response)
    })

    const deleteEvent = async (payload: DeleteEventPayload) => {
        return await fetchData(payload);
    };

    return {
        loading,
        error,
        deleteEvent,
    };
};

export default useDeleteEvent;
