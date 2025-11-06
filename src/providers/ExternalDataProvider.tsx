import * as Calendar from 'expo-calendar';
import { useGlobalSearchParams, usePathname } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { DateTime } from 'luxon';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import {
  loadedDatestampsAtom,
  trackLoadedDatestampAtom
} from '@/atoms/planner/loadedDatestampsAtom';
import { savePlannerChipDataAtom } from '@/atoms/planner/plannerChips';
import useAppInitialization from '@/hooks/useAppInitialization';
import { calendarIconMap } from '@/lib/constants/calendarIcons';
import { TPlannerChip } from '@/lib/types/planner/TPlannerChip';
import { TPlannerPageParams } from '@/lib/types/routeParams/TPlannerPageParams';
import { extractNameFromBirthdayText, openMessageForContact } from '@/utils/birthdayUtils';
import {
  getDayShiftedDatestamp,
  isoToDatestamp,
  isTimeEarlier,
  isTimeEarlierOrEqual
} from '@/utils/dateUtils';
import {
  openEditEventModal,
  openViewEventModal,
  upsertCalendarEventsIntoPlanner
} from '@/utils/plannerUtils';
import { loadWeatherToStore } from '@/utils/weatherUtils';

// ✅

type ExternalDataContextType = {
  loadingPathnames: Set<string>;
  onReloadPage: () => Promise<void>;
};

/**
 * Validates if a calendar event should be displayed in the planner of the given datestamp.
 *
 * @param event - The calendar event to analyze.
 * @param datestamp - The date to consider. (YYYY-MM-DD)
 * @returns True if the event should be in the given planner, else false.
 */
function isPlannerEvent(event: Calendar.Event, datestamp: string): boolean {
  if (event.allDay || !event.endDate) return false;

  const nextDayDatestamp = getDayShiftedDatestamp(datestamp, 1);

  const eventStartsOnThisDay =
    isTimeEarlierOrEqual(datestamp, event.startDate as string) &&
    isTimeEarlier(event.startDate as string, nextDayDatestamp);

  const eventEndsOnThisDay =
    isTimeEarlierOrEqual(datestamp, event.endDate as string) &&
    isTimeEarlier(event.endDate as string, nextDayDatestamp);

  return eventStartsOnThisDay || eventEndsOnThisDay;
}

/**
 * Determines if a calendar event should be displayed as an event chip for the given datestamp.
 *
 * An event will be a chip if it is an all-day event for the given date or it is a multi-day event that
 * starts on, ends on, or spans the given date.
 *
 * @param event - The calendar event to analyze.
 * @param datestamp - The date to consider. (YYYY-MM-DD)
 * @returns True if the event should be displayed on the given date as a chip, else false.
 */
function isEventChip(event: Calendar.Event, datestamp: string): boolean {
  if (!event.endDate || !event.startDate) return false;

  if (event.allDay) {
    const eventStartDatestamp = isoToDatestamp(event.startDate as string);
    const eventEndDatestamp = isoToDatestamp(event.endDate as string);

    return (
      isTimeEarlierOrEqual(eventStartDatestamp, datestamp) &&
      isTimeEarlierOrEqual(datestamp, eventEndDatestamp)
    );
  } else {
    const nextDayDatestamp = getDayShiftedDatestamp(datestamp, 1);

    return (
      isTimeEarlier(event.startDate as string, nextDayDatestamp) &&
      isTimeEarlier(datestamp, event.endDate as string)
    );
  }
}

/**
 * Maps a calendar event to an event chip for a given planner.
 *
 * @param event - The calendar event to map.
 * @param calendar - The calendar the event is from.
 * @param datestamp - The key of the planner where the chip will reside.
 * @param hasContactsPermissions - True if the app has access to the device Contacts app.
 * @returns A planner event chip representing the calendar event.
 */
function mapCalendarEventToPlannerChip(
  event: Calendar.Event,
  calendar: Calendar.Calendar,
  datestamp: string,
  hasContactsPermissions: boolean
): TPlannerChip {
  const { title: calendarTitle, color } = calendar;

  const calendarEventChip: TPlannerChip = {
    title: event.title,
    id: event.id,
    color,
    iconConfig: {
      name: calendarIconMap[calendarTitle] ?? 'calendar'
    }
  };

  if (calendar.title === 'Birthdays' && hasContactsPermissions) {
    calendarEventChip.onClick = () =>
      openMessageForContact(extractNameFromBirthdayText(event.title), 'Happy Birthday!');
  }

  if (calendar.allowsModifications) {
    calendarEventChip.onClick = () => openEditEventModal(event.id, datestamp);
  } else {
    calendarEventChip.onClick = () => openViewEventModal(event.id);
  }

  return calendarEventChip;
}

const ExternalDataContext = createContext<ExternalDataContextType | undefined>(undefined);

export function ExternalDataProvider({ children }: { children: ReactNode }) {
  const { datestamp } = useGlobalSearchParams<TPlannerPageParams>();
  const pathname = usePathname();

  const { appReady, onLoadAllDayEventsToStore, onLoadBaseData } = useAppInitialization();

  const loadedDatestamps = useAtomValue(loadedDatestampsAtom);
  const trackLoadedDatestamp = useSetAtom(trackLoadedDatestampAtom);
  const savePlannerChipData = useSetAtom(savePlannerChipDataAtom);

  const [loadingPathnames, setLoadingPathnames] = useState<Set<string>>(new Set<string>());

  // Handle initial loading of calendar data for newly-mounted planners.
  useEffect(() => {
    // Exit if app isn't ready or the current page is not a planner.
    if (!appReady || !pathname.includes('planners')) return;

    // Exit if the current datestamp has already been loaded.
    if (datestamp && loadedDatestamps.has(datestamp)) return;

    handleLoadPage();
  }, [pathname, appReady, loadedDatestamps]);

  // TODO: no any
  async function loadCalendarData(
    datestamps: string[],
    hasCalendarsPermissions: boolean,
    hasContactsPermissions: boolean,
    calendarMap: any
  ) {
    if (datestamps.length === 0) return;

    const plannerChipMap: Record<string, TPlannerChip[][]> = {};
    const calendarEventMap: Record<string, Calendar.Event[]> = {};
    datestamps.forEach((datestamp) => {
      plannerChipMap[datestamp] = [];
      calendarEventMap[datestamp] = [];
    });

    if (hasCalendarsPermissions) {
      const allCalendarIds = Object.keys(calendarMap);
      const startDate = DateTime.fromISO(datestamps[0]).startOf('day').toJSDate();
      const endDate = DateTime.fromISO(datestamps[datestamps.length - 1])
        .endOf('day')
        .toJSDate();
      const calendarEvents = await Calendar.getEventsAsync(allCalendarIds, startDate, endDate);

      // Phase 2: Organize the calendar events by datestamp.
      datestamps.forEach((datestamp) => {
        const calendarChipGroups: Record<string, TPlannerChip[]> = {};

        calendarEvents.forEach((calendarEvent) => {
          if (isEventChip(calendarEvent, datestamp)) {
            const calendarId = calendarEvent.calendarId;
            if (!calendarChipGroups[calendarId]) {
              calendarChipGroups[calendarId] = [];
            }
            calendarChipGroups[calendarId].push(
              mapCalendarEventToPlannerChip(
                calendarEvent,
                calendarMap[calendarId],
                datestamp,
                hasContactsPermissions
              )
            );
          }

          if (isPlannerEvent(calendarEvent, datestamp)) {
            calendarEventMap[datestamp].push(calendarEvent);
          }
        });

        // Push grouped calendar chips into a 2D array
        plannerChipMap[datestamp] = Object.values(calendarChipGroups);
      });
    } else {
      // TODO: handle no more access to calendar
    }

    // Phase 3: Save the planner chips to the store. (No MMKV storage records required).
    savePlannerChipData(plannerChipMap);

    // Phase 4: Update all the planners linked to the calendar events.
    datestamps.forEach((datestamp) => {
      upsertCalendarEventsIntoPlanner(datestamp, calendarEventMap[datestamp]);
    });
  }

  async function handleLoadPage() {
    setLoadingPathnames((prev) => {
      const current = new Set(prev);
      current.add(pathname);
      return current;
    });

    // Load global app data.
    const { hasCalendarsPermissions, hasContactsPermissions, calendarMap } = await onLoadBaseData();

    // Load page-specific data.
    if (pathname.includes('planners') && datestamp) {
      await loadWeatherToStore(datestamp);
      await loadCalendarData(
        [datestamp],
        hasCalendarsPermissions,
        hasContactsPermissions,
        calendarMap
      );
      trackLoadedDatestamp(datestamp);
    } else if (pathname.includes('upcomingDates')) {
      await onLoadAllDayEventsToStore(hasCalendarsPermissions, calendarMap);
    }

    setLoadingPathnames((prev) => {
      const current = new Set(prev);
      current.delete(pathname);
      return current;
    });
  }

  if (!appReady) return null;

  return (
    <ExternalDataContext.Provider value={{ onReloadPage: handleLoadPage, loadingPathnames }}>
      {children}
    </ExternalDataContext.Provider>
  );
}

export function useExternalDataContext() {
  const context = useContext(ExternalDataContext);
  if (!context) {
    throw new Error('useExternalDataContext must be used within an ExternalDataProvider.');
  }
  return context;
}
