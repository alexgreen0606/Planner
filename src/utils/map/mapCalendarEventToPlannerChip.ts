import { TCalendarEventChip } from "@/lib/types/calendar/TCalendarEventChip";
import { TIME_MODAL_PATHNAME } from "app/(modals)/timeModal/[datestamp]/[eventId]/[sortId]/[eventValue]";
import { Router } from "expo-router";
import * as Calendar from 'expo-calendar';
import { calendarIconMap } from "@/lib/constants/calendarIcons";
import { extractNameFromBirthdayText, openMessage } from "../birthdayUtils";
import { NULL } from "@/lib/constants/generic";
import { hasCalendarAccess, hasContactsAccess } from "../accessUtils";

/**
 * ✅ Maps a calendar event to an event chip for a given planner.
 * 
 * @param event - The calendar event to map.
 * @param calendar - The calendar the event is from.
 * @param datestamp - The key of the planner where the chip will reside.
 * @returns A planner event chip representing the calendar event.
 */
export function mapCalendarEventToPlannerChip(event: Calendar.Event, calendar: Calendar.Calendar, datestamp: string): TCalendarEventChip {
    const { title: calendarTitle, color } = calendar;

    const calendarEventChip: TCalendarEventChip = {
        event,
        color,
        iconConfig: {
            type: calendarIconMap[calendarTitle] ?? 'calendar'
        }
    };

    if (calendar.title === 'Birthdays') {
        calendarEventChip.onClick = () => openMessage(extractNameFromBirthdayText(event.title));
        calendarEventChip.hasClickAccess = hasContactsAccess();
    }

    if (calendar.isPrimary || calendar.title === 'Calendar') {
        calendarEventChip.onClick = (router?: Router) => {
            if (!router) throw new Error('No router provided to chip.')
            router.push(`${TIME_MODAL_PATHNAME
                }${datestamp
                }/${event.id
                }/${NULL
                }/${event.title
                }`
            );
        };
        calendarEventChip.hasClickAccess = hasCalendarAccess();
    }

    return calendarEventChip;
}