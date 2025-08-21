import { calendarIconMap } from "@/lib/constants/calendarIcons";
import { NULL } from "@/lib/constants/generic";
import { TIME_MODAL_PATHNAME } from "@/lib/constants/pathnames";
import { TCalendarEventChip } from "@/lib/types/calendar/TCalendarEventChip";
import * as Calendar from 'expo-calendar';
import { Router } from "expo-router";
import { hasCalendarAccess, hasContactsAccess } from "../accessUtils";
import { extractNameFromBirthdayText, openMessageForContact } from "../birthdayUtils";

/**
 * Maps a calendar event to an event chip for a given planner.
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
        calendarEventChip.onClick = () => openMessageForContact(extractNameFromBirthdayText(event.title), 'Happy Birthday!');
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