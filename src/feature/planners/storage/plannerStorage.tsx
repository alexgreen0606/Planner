import { MMKV } from 'react-native-mmkv';
import { Event } from '../types';
import { StorageIds } from '../../../enums';
import { RECURRING_WEEKDAY_PLANNER } from '../enums';
import { eventsAreEqual, getNextSevenDayTimestamps, isTimestampWeekday } from '../utils';

// Initialize MMKV storage
const storage = new MMKV({ id: StorageIds.PLANNER_STORAGE });

export const getPlannerKey = (timestamp: string) => {
    return `PLANNERS_${timestamp}`;
}

export const getPlanner = (plannerId: string): Event[] => {
    const eventsString = storage.getString(getPlannerKey(plannerId));
    if (eventsString) {
        return JSON.parse(eventsString);
    } else if (isTimestampWeekday(plannerId)) {
        return getPlanner(RECURRING_WEEKDAY_PLANNER);
    } else {
        return [];
    }
}

export const savePlanner = (plannerId: string, newPlanner: Event[]) => {

    // When the recurring planner changes, update the next week of events
    if (plannerId === RECURRING_WEEKDAY_PLANNER) {
        const oldRecurringPlanner = getPlanner(plannerId);
        const oldRecurringPlannerIds = oldRecurringPlanner.map(event => event.id);
        const next7Days = getNextSevenDayTimestamps();

        next7Days.forEach(day => {
            if (isTimestampWeekday(day)) {
                const upcomingPlanner: Event[] = getPlanner(day);

                // Sync the existing planner with the updated events
                const newUpcomingPlanner: Event[] = upcomingPlanner.reduce<Event[]>((accumulator, currentEvent) => {

                    const oldRecurringEvent = oldRecurringPlanner.find(event => event.id === currentEvent.id);
                    if (
                        oldRecurringEvent &&
                        eventsAreEqual(oldRecurringEvent, currentEvent)
                    ) { // the event is recurring and hasn't been customized

                        const newRecurringEvent = newPlanner.find(event => event.id === oldRecurringEvent.id);
                        if (newRecurringEvent) { // recurring event still exists
                            return [...accumulator, newRecurringEvent];

                        } else { // recurring event has been deleted
                            return [...accumulator];
                        }
                    }

                    // the event is custom, so keep it
                    return [...accumulator, currentEvent];
                }, []);

                // Add any new events
                newPlanner.forEach(newEvent => {
                    if (!oldRecurringPlannerIds.includes(newEvent.id)) {
                        newUpcomingPlanner.push(newEvent);
                    }
                });

                // Sort the planner by sortId
                newUpcomingPlanner.sort((a, b) => a.sortId - b.sortId);

                // Save the updated planner for the day
                savePlanner(day, newUpcomingPlanner);
            }
        });
    }

    storage.set(getPlannerKey(plannerId), JSON.stringify(newPlanner));
}
