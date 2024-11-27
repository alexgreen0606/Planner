import { useApi } from '../../../foundation/api/hooks/useApi';
import { usePlannersContext } from '../services/PlannersProvider';
import { Event, EventPayload } from '../types';
import { generateEvent, generateEventPayload } from '../utils';

interface UpdateEventPayload {
    event: Event;
}

const useUpdateEvent = () => {
    const { increment, decrement, addError } = usePlannersContext();
    const { error, loading, callApi } = useApi<UpdateEventPayload, EventPayload, EventPayload, Event>({
        api: 'backend',
        endpoint: '/updateEvent',
        method: 'PUT',
        formatPayload: (payload: UpdateEventPayload) => generateEventPayload(payload.event),
        formatResponse: (response) => generateEvent(response)
    })

    const updateEvent = async (payload: UpdateEventPayload) => {
        increment();
        return await callApi(payload)
            .then((result) => {
                return result;
            })
            .catch((error) => {
                addError({ message: error.message || 'An unexpected error occurred' });
                return null
            })
            .finally(() => {
                decrement();
            });
    };

    return {
        loading,
        error,
        updateEvent,
    };
};

export default useUpdateEvent;
