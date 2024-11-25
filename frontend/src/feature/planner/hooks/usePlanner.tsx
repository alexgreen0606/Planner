import { Event, EventPayload } from '../types';
import { useApi } from '../../../foundation/api/hooks/useApi';
import { useEffect } from 'react';

const usePlanner = (timestamp: string) => {
  const { error, data, loading, fetchData } = useApi<void, void, EventPayload[], Event[]>({
    api: 'backend',
    endpoint: `/getPlanner?timestamp=${timestamp}`,
    formatResponse: (response) => response.map((event) => ({ ...event, sortId: event.sort_id, sort_id: undefined }))
  });

  useEffect(() => {
    fetchData();
  }, []);

  return {
    loading,
    error,
    planner: data
  };
};

export default usePlanner;
