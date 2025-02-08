import ReactNativeCalendarEvents from "react-native-calendar-events";
import { CalendarDetails, getCalendarAccess } from "../../foundation/calendar/calendarUtils";
import { Color } from "../../foundation/theme/colors";
import { getGenericTimestampTenYearsFromToday, getTodayGenericTimestamp } from "../../foundation/calendar/dateUtils";
import { ItemStatus, ListItem } from "../../foundation/sortedLists/sortedListUtils";

export const BIRTHDAY_STORAGE_ID = 'BIRTHDAY_STORAGE_ID';
export const BIRTHDAY_CHECKLIST_STORAGE_ID = 'BIRTHDAY_CHECKLIST_ID';
export const COUNTDOWN_LIST_KEY = 'COUNTDOWN_LIST_KEY';

export interface Countdown extends ListItem {
    date: Date;
};

async function getCountdownCalendarDetails(): Promise<CalendarDetails> {
    await getCalendarAccess();
    const calendars = await ReactNativeCalendarEvents.findCalendars();
    const countdownCalendar = calendars.find(calendar => calendar.title === 'Countdowns');
    let countdownCalendarId = countdownCalendar?.id;;
    if (!countdownCalendarId) {
        const defaultSource = calendars.find(cal => cal.isPrimary)?.source
            || calendars.find(cal => cal.title.includes('iCloud'))?.source
            || calendars[0]?.source; // Fallback to first available source

        // Create the countdown calendar
        countdownCalendarId = await ReactNativeCalendarEvents.saveCalendar({
            title: 'Countdowns',
            color: Color.RED,
            entityType: 'event',
            name: 'Countdowns',
            accessLevel: 'owner',
            ownerAccount: 'plannerApp',
            source: {
                name: defaultSource,
                isLocalAccount: true
            }
        })
    }
    return { id: countdownCalendarId, color: Color.RED };
};

export async function getCountdowns(): Promise<Countdown[]> {
    const countdownDetails = await getCountdownCalendarDetails();
    const startDate = new Date(`${getTodayGenericTimestamp()}T00:00:00`).toISOString();
    const endDate = new Date(`${getGenericTimestampTenYearsFromToday()}T23:59:59`).toISOString();

    const countdownEvents = await ReactNativeCalendarEvents.fetchAllEvents(startDate, endDate, [countdownDetails.id]);
    return countdownEvents.map((countdownEvent, i) => ({
        id: countdownEvent.id,
        value: countdownEvent.title,
        sortId: i + 1,
        listId: COUNTDOWN_LIST_KEY,
        status: ItemStatus.STATIC,
        date: new Date(countdownEvent.startDate)
    }));
};

export async function saveCountdown(countdown: Countdown, createNew: boolean) {
    await ReactNativeCalendarEvents.saveEvent(
        countdown.value,
        {
            calendarId: (await getCountdownCalendarDetails()).id,
            startDate: countdown.date.toISOString(),
            endDate: countdown.date.toISOString(),
            allDay: true,
            id: createNew ? undefined : countdown.id
        }
    );
};

export async function deleteCountdown(countdown: Countdown) {
    await ReactNativeCalendarEvents.removeEvent(countdown.id);
};