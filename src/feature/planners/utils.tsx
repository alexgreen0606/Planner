import { generateSortId } from "../../foundation/sortedLists/utils";
import { DropdownOption } from "../../foundation/ui/input/TimeDropdown";
import { Event } from "./types";

export const timestampToDayOfWeek = (timestamp: string) => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = new Date(timestamp + 'T00:00:00');
    return daysOfWeek[date.getDay()]
}

export const timestampToMonthDate = (timestamp: string) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const date = new Date(timestamp + 'T00:00:00');
    return `${months[date.getMonth()]} ${date.getDate()}`;
}

export const isValidTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const isWeekday = (timestamp: string) => {
    if (!isValidTimestamp(timestamp)) return false;
    return WEEKDAYS.includes(timestampToDayOfWeek(timestamp));
}

export const getNextSevenDayTimestamps = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
}

export const eventsAreEqual = (oldEvent: Event, newEvent: Event) => { // TODO: extend once times are implemented
    return (
        oldEvent.value === newEvent.value
    )
}

export const generateTimeOptions = (baseDate: string): DropdownOption[] => {
    const options = [];
    const [year, month, day] = baseDate.split('-').map(Number);

    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 5) {
            const period = hour < 12 ? "AM" : "PM";
            const formattedHour = hour % 12 === 0 ? 12 : hour % 12; // Convert 0 to 12 for midnight and 12-hour format
            const formattedMinute = minute.toString().padStart(2, "0");
            const label = `${formattedHour}:${formattedMinute} ${period}`;

            // Create a date object in local time
            const localDate = new Date(year, month - 1, day, hour, minute);

            // Convert to UTC timestamp
            const isoTime = localDate.toISOString();

            options.push({ value: isoTime, label });
        }
    }

    return options;
};

export const generateGenericTimeOptions = (): DropdownOption[] => {
    const options = [];

    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 5) {
            const period = hour < 12 ? "AM" : "PM";
            const formattedHour = hour % 12 === 0 ? 12 : hour % 12; // Convert 0 to 12 for midnight and 12-hour format
            const formattedMinute = minute.toString().padStart(2, "0");
            const label = `${formattedHour}:${formattedMinute} ${period}`;

            // Create a generic time string
            const timeValue = `${hour.toString().padStart(2, "0")}:${formattedMinute}`;

            options.push({ value: timeValue, label });
        }
    }

    return options;
};

export const handleTimestamp = (baseDate: string, timeValue: string): string => {
    const [year, month, day] = baseDate.split('-').map(Number);
    const [hour, minute] = timeValue.split(':').map(Number);

    const localDate = new Date(year, month - 1, day, hour, minute);
    return localDate.toISOString();
};





export const formatToLocalDateTime = (isoTimestamp: string) => {
    const date = new Date(isoTimestamp);

    const timeOptions: Intl.DateTimeFormatOptions = {
        hour: 'numeric', // e.g., "2 PM" or "14"
        minute: 'numeric', // e.g., "30"
        hour12: true, // Use 12-hour format (set to false for 24-hour)
        timeStyle: 'short'
    };

    console.log(date.getMinutes())

    let formattedTime = date.toLocaleTimeString(undefined, timeOptions);

    if (date.getMinutes() === 0) {
        formattedTime = formattedTime.replace(':00', '')
    }

    return formattedTime;
};

// get the planner for the event
export function getPlannerIdFromTimestamp(isoTimestamp: string) {
    const date = new Date(isoTimestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Finds a spot in the list for a new event where it will be 
 * @param event 
 * @param planner 
 * @returns 
 */
export const generateSortIdByTimestamp = (event: Event, planner: Event[]) => {
    if (!event.timeConfig) return event.sortId;

    planner.sort((a, b) => a.sortId - b.sortId);

    // Find the first event whose startDate is after or equal to the event's startDate
    const newEventChildIndex = planner.findIndex(
        (existingEvent) =>
            event.timeConfig &&
            existingEvent.timeConfig?.startDate &&
            new Date(event.timeConfig.startDate) <= new Date(existingEvent.timeConfig.startDate)
    );

    
    if (newEventChildIndex !== -1) {
        let newParentSortId = -1;
        if (newEventChildIndex > 0)
            newParentSortId = planner[newEventChildIndex - 1].sortId;
        return generateSortId(newParentSortId, planner);
    }

    // If no such event exists, return the event's original sortId
    return event.sortId;
};