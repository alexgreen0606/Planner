import { useApi } from '../../../foundation/api/hooks/useApi';
import { ListItem } from '../../../foundation/lists/types';
import { Event, EventPayload } from '../types';
import { generateEvent } from '../utils';
import { usePlannersContext } from '../services/PlannersProvider';

const useCreateEvent = (timestamp: string) => {
    const { increment, decrement, addError } = usePlannersContext();
    const { callApi } = useApi<ListItem, EventPayload, EventPayload, Event>({
        api: 'backend',
        endpoint: '/createEvent',
        method: 'POST',
        formatPayload: (item: ListItem) => ({
            ...item,
            sort_id: item.sortId,
            apple_id: '',
            timestamp,
        } as EventPayload),
        formatResponse: (response) => generateEvent(response),
    });

    const createEvent = async (item: ListItem) => {
        increment();
        return await callApi(item)
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
        createEvent,
    };
};

export default useCreateEvent;
