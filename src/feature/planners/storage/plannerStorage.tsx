import { MMKV } from 'react-native-mmkv';
import { Event } from '../types';
import { StorageIds } from '../../../enums';

// Initialize MMKV storage
const storage = new MMKV({id: StorageIds.PLANNER_STORAGE});

const getPlannerKey = (timestamp: string) => {
    const dateStr = new Date(timestamp).toISOString().split('T')[0];
    return `planner_${dateStr}`;
}

export const getPlanner = (timestamp: string) => {
    console.log('Getting planner')
    // Fetch events for the given date from MMKV storage
    const eventsString = storage.getString(getPlannerKey(timestamp));

    if (eventsString) {
        const events: Event[] = JSON.parse(eventsString);
        return events;
    } else {
        // No events found for the given date
        return [];
    }
}

export const savePlanner = (timestamp: string, newPlanner: Event[]) =>
    storage.set(getPlannerKey(timestamp), JSON.stringify(newPlanner));
