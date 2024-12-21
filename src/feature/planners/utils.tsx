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

export const isTimestampWeekday = (timestamp: string) => {
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

export const generateTimeOptions = (): DropdownOption[] => {
    const options = [];
    let value = 1;

    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 5) {
            const period = hour < 12 ? "AM" : "PM";
            const formattedHour = hour % 12 === 0 ? 12 : hour % 12; // Convert 0 to 12 for midnight and 12-hour format
            const formattedMinute = minute.toString().padStart(2, "0");
            const label = `${formattedHour}:${formattedMinute} ${period}`;
            options.push({ value: String(value++), label });
        }
    }

    return options;
};
