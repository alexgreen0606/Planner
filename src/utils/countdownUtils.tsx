import { getDatestampThreeYearsFromToday, getTodayDatestamp } from "@/utils/dateUtils";
import ReactNativeCalendarEvents from "react-native-calendar-events";
import { getCalendarAccess } from "./calendarUtils";
import { TCalendarDetails } from "@/types/calendar/TCalendarDetails";
import { EItemStatus } from "@/enums/EItemStatus";
import { StorageKey } from "@/constants/storage";
import { ICountdown } from "@/types/listItems/ICountdown";

async function getCountdownCalendarDetails(): Promise<TCalendarDetails> {
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
            color: 'systemRed',
            entityType: 'event',
            name: 'Countdowns',
            accessLevel: 'owner',
            ownerAccount: 'plannerApp',
            source: {
                name: defaultSource,
                isLocalAccount: true
            }
        });
    }
    return { id: countdownCalendarId, color: 'systemRed', iconType: 'alert', isPrimary: false, isBirthday: false };
};

export async function getCountdowns(): Promise<ICountdown[]> {
    const countdownDetails = await getCountdownCalendarDetails();
    const startDate = new Date(`${getTodayDatestamp()}T00:00:00`).toISOString();
    const endDate = new Date(`${getDatestampThreeYearsFromToday()}T23:59:59`).toISOString();

    const countdownEvents = await ReactNativeCalendarEvents.fetchAllEvents(startDate, endDate, [countdownDetails.id]);
    return countdownEvents.map((countdownEvent, i) => ({
        id: countdownEvent.id,
        value: countdownEvent.title,
        sortId: i + 1,
        listId: StorageKey.COUNTDOWN_LIST_KEY,
        status: EItemStatus.STATIC,
        startTime: countdownEvent.startDate
    }));
};

export async function saveCountdown(countdown: ICountdown, createNew: boolean = false): Promise<void> {
    console.log(countdown, createNew, await getCountdownCalendarDetails())
    await getCalendarAccess();
    try {
    await ReactNativeCalendarEvents.saveEvent(
        countdown.value,
        {
            id: createNew ? undefined : countdown.id,
            calendarId: (await getCountdownCalendarDetails()).id,
            startDate: countdown.startTime,
            endDate: countdown.startTime,
            allDay: true,
        }
    );
} catch (e) {
    console.error(e)
}
};

export async function deleteCountdowns(countdowns: ICountdown[]) {
    await Promise.all(
        countdowns.map((countdown) => ReactNativeCalendarEvents.removeEvent(countdown.id))
    );
}