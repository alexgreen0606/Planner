import { visibleDatestampsAtom } from "@/atoms/visibleDatestamps";
import { StorageKey } from "@/lib/constants/storage";
import { EItemStatus } from "@/lib/enums/EItemStatus";
import { TCalendarDetails } from "@/lib/types/calendar/TCalendarDetails";
import { ICountdown } from "@/lib/types/listItems/ICountdown";
import { getDatestampThreeYearsFromToday, getTodayDatestamp, isoToDatestamp } from "@/utils/dateUtils";
import { jotaiStore } from "app/_layout";
import * as Calendar from 'expo-calendar';
import { getCalendarMap, loadCalendarData } from "./calendarUtils";

async function getCountdownCalendarDetails(): Promise<TCalendarDetails> {
    const calendarMap = await getCalendarMap();
    const allCalendars = Object.values(calendarMap);
    const countdownCalendar = allCalendars.find(calendar => calendar.title === 'Countdowns');
    let countdownCalendarId = countdownCalendar?.id;
    if (!countdownCalendarId) {

        // Create the countdown calendar
        countdownCalendarId = await Calendar.createCalendarAsync({
            title: 'Countdowns',
            color: 'rgb(255,56,60)',
            entityType: Calendar.EntityTypes.EVENT,
            name: 'Countdowns',
            ownerAccount: 'PlannerApp'
        });
    }
    return { id: countdownCalendarId, color: 'systemRed', iconType: 'alert', isPrimary: false, isBirthday: false };
}

export async function getCountdowns(): Promise<ICountdown[]> {
    const { id } = await getCountdownCalendarDetails();
    const startDate = new Date(`${getTodayDatestamp()}T00:00:00`);
    const endDate = new Date(`${getDatestampThreeYearsFromToday()}T23:59:59`);

    const countdownEvents = await Calendar.getEventsAsync([id], startDate, endDate);
    console.log(countdownEvents, 'countdowns')
    return countdownEvents.map((countdownEvent, i) => ({
        id: countdownEvent.id,
        value: countdownEvent.title,
        sortId: i + 1,
        listId: StorageKey.COUNTDOWN_LIST_KEY,
        status: EItemStatus.STATIC,
        startTime: countdownEvent.startDate as string
    }));
}

export async function saveCountdown(countdown: ICountdown, createNew: boolean = false): Promise<void> {
    const plannerDatestamps = jotaiStore.get(visibleDatestampsAtom);
    const countdownDatestamp = isoToDatestamp(countdown.startTime);
    const todayDatestamp = getTodayDatestamp();

    const { id } = await getCountdownCalendarDetails();

    // Phase 1: Save the event to the calendar.
    const eventDetails = {
        title: countdown.value,
        startDate: countdown.startTime,
        endDate: countdown.startTime,
        allDay: true
    };
    if (createNew) {
        await Calendar.createEventAsync(id, eventDetails);
    } else {
        await Calendar.updateEventAsync(id, eventDetails);
    }

    // Phase 2: Reload the calendar data if this event affects the current planners.
    if ([todayDatestamp, ...plannerDatestamps].includes(countdownDatestamp)) {
        await loadCalendarData([countdownDatestamp]);
    }

}

export async function deleteCountdowns(countdowns: ICountdown[]) {
    const allVisibleDatestamps = [getTodayDatestamp(), ...jotaiStore.get(visibleDatestampsAtom)];


    // Phase 1: Delete all the events from the planner.
    await Promise.all(
        countdowns.map((countdown) => Calendar.deleteEventAsync(countdown.id))
    );

    // Phase 2: Reload the calendar data if any of the events affect the current planners.
    const affectedDatestamps = new Set<string>();
    for (const visible of allVisibleDatestamps) {
        if (countdowns.some(event => event.listId === visible)) {
            affectedDatestamps.add(visible);
        }
    }
    await loadCalendarData(Array.from(affectedDatestamps));

}
