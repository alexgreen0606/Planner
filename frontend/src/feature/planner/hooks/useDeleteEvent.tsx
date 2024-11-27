import { useApi } from '../../../foundation/api/hooks/useApi';
import { usePlannersContext } from '../services/PlannersProvider';
import { Event, EventPayload } from '../types';
import { generateEvent, generateEventPayload } from '../utils';

interface DeleteEventPayload {
    event: Event;
}

const useDeleteEvent = () => {
    const { increment, decrement, addError } = usePlannersContext();
    const { error, loading, callApi } = useApi<DeleteEventPayload, EventPayload, EventPayload, Event>({
        api: 'backend',
        endpoint: '/deleteEvent',
        method: 'DELETE',
        formatPayload: (payload: DeleteEventPayload) => (generateEventPayload(payload.event)),
        formatResponse: (response) => generateEvent(response)
    })

    const deleteEvent = async (payload: DeleteEventPayload) => {
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
        deleteEvent,
    };
};

export default useDeleteEvent;
