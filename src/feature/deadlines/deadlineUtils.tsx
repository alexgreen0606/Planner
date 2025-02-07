import ReactNativeCalendarEvents from "react-native-calendar-events";
import { CalendarDetails, getCalendarAccess } from "../../foundation/calendar/calendarUtils";
import { Color } from "../../foundation/theme/colors";
import { getGenericTimestampTenYearsFromToday, getTodayGenericTimestamp } from "../../foundation/calendar/dateUtils";
import { ItemStatus, ListItem } from "../../foundation/sortedLists/sortedListUtils";

export const BIRTHDAY_STORAGE_ID = 'BIRTHDAY_STORAGE_ID';
export const BIRTHDAY_CHECKLIST_STORAGE_ID = 'BIRTHDAY_CHECKLIST_ID';
export const DEADLINE_LIST_KEY = 'DEADLINE_LIST_KEY';

export interface Deadline extends ListItem {
    date: Date;
}

async function getDeadlineCalendarDetails(): Promise<CalendarDetails> {
    await getCalendarAccess();
    const calendars = await ReactNativeCalendarEvents.findCalendars();
    const deadlineCalendar = calendars.find(calendar => calendar.title === 'Deadlines');
    let deadlineCalendarId = deadlineCalendar?.id;;
    if (!deadlineCalendarId) {
        const defaultSource = calendars.find(cal => cal.isPrimary)?.source
            || calendars.find(cal => cal.title.includes('iCloud'))?.source
            || calendars[0]?.source; // Fallback to first available source

        // Create the deadline calendar
        deadlineCalendarId = await ReactNativeCalendarEvents.saveCalendar({
            title: 'Deadlines',
            color: Color.RED,
            entityType: 'event',
            name: 'Deadlines',
            accessLevel: 'owner',
            ownerAccount: 'plannerApp',
            source: {
                name: defaultSource,
                isLocalAccount: true
            }
        })
    }
    return { id: deadlineCalendarId, color: Color.RED };
};

export async function getDeadlines(): Promise<Deadline[]> {
    const deadlineDetails = await getDeadlineCalendarDetails();
    const startDate = new Date(`${getTodayGenericTimestamp()}T00:00:00`).toISOString();
    const endDate = new Date(`${getGenericTimestampTenYearsFromToday()}T23:59:59`).toISOString();

    const deadlineEvents = await ReactNativeCalendarEvents.fetchAllEvents(startDate, endDate, [deadlineDetails.id]);
    return deadlineEvents.map((deadlineEvent, i) => ({
        id: deadlineEvent.id,
        value: deadlineEvent.title,
        sortId: i + 1,
        listId: DEADLINE_LIST_KEY,
        status: ItemStatus.STATIC,
        date: new Date(deadlineEvent.startDate)
    }));
};

export async function saveDeadline(deadline: Deadline, createNew: boolean) {
    await ReactNativeCalendarEvents.saveEvent(
        deadline.value,
        {
            calendarId: (await getDeadlineCalendarDetails()).id,
            startDate: deadline.date.toISOString(),
            endDate: deadline.date.toISOString(),
            allDay: true,
            id: createNew ? undefined : deadline.id
        }
    );
};

export async function deleteDeadline(deadline: Deadline) {
    await ReactNativeCalendarEvents.removeEvent(deadline.id);
};