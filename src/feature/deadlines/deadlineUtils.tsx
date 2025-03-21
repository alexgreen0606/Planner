import ReactNativeCalendarEvents from "react-native-calendar-events";
import { getCalendarAccess } from "../../foundation/calendarEvents/calendarUtils";
import { getDatestampThreeYearsFromToday, getTodayDatestamp } from "../../foundation/calendarEvents/timestampUtils";
import { CalendarDetails, Deadline } from "../../foundation/calendarEvents/types";
import { DEADLINE_LIST_KEY } from "./types";
import { ItemStatus } from "../../foundation/sortedLists/types";

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
            color: 'systemRed',
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
    return { id: deadlineCalendarId, color: 'systemRed', iconType: 'alert', isPrimary: false, isBirthday: false };
};

export async function getDeadlines(): Promise<Deadline[]> {
    const deadlineDetails = await getDeadlineCalendarDetails();
    const startDate = new Date(`${getTodayDatestamp()}T00:00:00`).toISOString();
    const endDate = new Date(`${getDatestampThreeYearsFromToday()}T23:59:59`).toISOString();

    const deadlineEvents = await ReactNativeCalendarEvents.fetchAllEvents(startDate, endDate, [deadlineDetails.id]);
    return deadlineEvents.map((deadlineEvent, i) => ({
        id: deadlineEvent.id,
        value: deadlineEvent.title,
        sortId: i + 1,
        listId: DEADLINE_LIST_KEY,
        status: ItemStatus.STATIC,
        startTime: new Date(deadlineEvent.startDate)
    }));
};

export async function saveDeadline(deadline: Deadline, createNew: boolean) {
    await ReactNativeCalendarEvents.saveEvent(
        deadline.value,
        {
            calendarId: (await getDeadlineCalendarDetails()).id,
            startDate: deadline.startTime.toISOString(),
            endDate: deadline.startTime.toISOString(),
            allDay: true,
            id: createNew ? undefined : deadline.id
        }
    );
};

export async function deleteDeadline(deadline: Deadline) {
    await ReactNativeCalendarEvents.removeEvent(deadline.id);
};