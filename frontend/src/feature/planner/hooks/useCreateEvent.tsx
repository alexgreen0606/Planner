import { useApi } from '../../../foundation/api/hooks/useApi';
import { Event, EventPayload } from '../types';
import { generateEvent } from '../utils';

interface CreateEventPayload {
    value: string;
    timestamp: string;
    sortId: number;
}

const useCreateEvent = () => {
    const { error, loading, fetchData } = useApi<CreateEventPayload, EventPayload, EventPayload, Event>({
        api: 'backend',
        endpoint: '/createEvent',
        method: 'POST',
        formatPayload: (payload: CreateEventPayload) => ({
            id: '',
            sort_id: payload.sortId,
            apple_id: '',
            value: payload.value,
            timestamp: payload.timestamp
        }),
        formatResponse: (response) => generateEvent(response)
    })

    const createEvent = async (payload: CreateEventPayload) => {
        return fetchData(payload);
    };

    return {
        loading,
        error,
        createEvent,
    };
};

export default useCreateEvent;
