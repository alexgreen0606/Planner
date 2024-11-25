import { useApi } from '../../../foundation/api/hooks/useApi';
import { Event, EventPayload } from '../types';
import { generateEvent, generateEventPayload } from '../utils';

interface UpdateEventPayload {
    event: Event;
}

const useUpdateEvent = () => {
    const { error, loading, fetchData } = useApi<UpdateEventPayload, EventPayload, EventPayload, Event>({
        api: 'backend',
        endpoint: '/updateEvent',
        method: 'PUT',
        formatPayload: (payload: UpdateEventPayload) => generateEventPayload(payload.event),
        formatResponse: (response) => generateEvent(response)
    })

    const updateEvent = async (payload: UpdateEventPayload) => {
        return await fetchData(payload);
    };

    return {
        loading,
        error,
        updateEvent,
    };
};

export default useUpdateEvent;
