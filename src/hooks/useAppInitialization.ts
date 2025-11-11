import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import { useFonts } from 'expo-font';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';

import {
  calendarMapAtom,
  primaryCalendarAtom,
  upcomingDatesMapAtom
} from '@/atoms/planner/calendarAtoms';
import { plannerCarouselDataAtom } from '@/atoms/planner/plannerCarouselWeekAtom';
import { todayDatestampAtom } from '@/atoms/planner/todayDatestamp';
import { NULL } from '@/lib/constants/generic';
import { EAccess } from '@/lib/enums/EAccess';
import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { EStorageKey } from '@/lib/enums/EStorageKey';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { getDatestampOneYearFromToday, getTodayDatestamp } from '@/utils/dateUtils';

import usePermissions from './usePermissions';

const initialRootFolder: IFolderItem = {
  id: EStorageKey.ROOT_FOLDER_KEY,
  listId: NULL,
  itemIds: [],
  value: 'Checklists',
  platformColor: 'label',
  type: EFolderItemType.FOLDER,
  storageId: EStorageId.FOLDER_ITEM
};

const useAppInitialization = () => {
  const [primaryCalendar, setPrimaryCalendar] = useAtom(primaryCalendarAtom);
  const [calendarMapInStore, setCalendarMapInStore] = useAtom(calendarMapAtom);
  const setUpcomingDatesMap = useSetAtom(upcomingDatesMapAtom);
  const plannerCarouselWeeks = useAtomValue(plannerCarouselDataAtom);
  const setTodayDatestamp = useSetAtom(todayDatestampAtom);

  const {
    permission: hasCalendarPermissions,
    isLoaded: isCalendarPermissionsLoaded,
    onSetPermission: setCalendarPermissions
  } = usePermissions(EAccess.CALENDAR);
  const { isLoaded: isContactsPermissionsLoaded, onSetPermission: setContactsPermissions } =
    usePermissions(EAccess.CONTACTS);

  const [fontsLoaded] = useFonts({
    RoundHeavy: require('../../assets/fonts/SF-Compact-Rounded-Heavy.otf'),
    RoundMedium: require('../../assets/fonts/SF-Compact-Rounded-Medium.otf'),
    Round: require('../../assets/fonts/SF-Compact-Rounded-Regular.otf'),
    Text: require('../../assets/fonts/SF-Pro-Text-Regular.otf')
  });

  const folderItemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });
  const [rootFolder, setRootFolder] = useMMKVObject<IFolderItem>(
    EStorageKey.ROOT_FOLDER_KEY,
    folderItemStorage
  );

  const areCalendarsReady =
    (isCalendarPermissionsLoaded && !hasCalendarPermissions) ||
    (primaryCalendar && calendarMapInStore);
  const appReady =
    fontsLoaded &&
    areCalendarsReady &&
    isContactsPermissionsLoaded &&
    rootFolder &&
    plannerCarouselWeeks.weeks.length > 0;

  // Load in the initial calendar data.
  useEffect(() => {
    checkRootFolderExistence();
    handleLoadBaseData();
    const todayDatestampSchedulerId = startMidnightDatestampScheduler();

    return () => clearTimeout(todayDatestampSchedulerId);
  }, []);

  async function handleLoadBaseData() {
    // Get the calendar permissions.
    const hasCalendarsPermissions = await checkCalendarPermissions();
    const hasContactsPermissions = await checkContactsPermissions();

    // Get the calendar map.
    const calendarMap = await loadCalendarsMap(hasCalendarsPermissions);

    // Get the all-day events for the Upcoming Dates page.
    handleLoadAllDayEventsToStore(hasCalendarsPermissions, calendarMap);

    return { hasCalendarsPermissions, hasContactsPermissions, calendarMap };
  }

  async function handleLoadAllDayEventsToStore(
    hasCalendarsPermissions: boolean,
    calendarMap: any
  ): Promise<void> {
    if (!hasCalendarsPermissions) {
      // TODO: handle this case
    }

    try {
      // Get all upcoming all-day events
      const allDayEvents = await getAllDayEventsFromCalendarsForNextYear(calendarMap);

      // Group events by datestamp (YYYY-MM-DD)
      const eventsByDate: Record<string, Calendar.Event[]> = {};

      for (const event of allDayEvents) {
        // Extract date from event's startDate
        // startDate is in ISO format, so we extract the date part
        const eventDate = new Date(event.startDate);
        const datestamp = eventDate.toISOString().split('T')[0]; // YYYY-MM-DD format

        if (!eventsByDate[datestamp]) {
          eventsByDate[datestamp] = [];
        }
        eventsByDate[datestamp].push(event);
      }

      // Sort events within each date by title or start time for consistent ordering
      Object.keys(eventsByDate).forEach((date) => {
        eventsByDate[date].sort((a, b) => {
          // First sort by time if they have different times (unlikely for all-day events)
          const timeCompare = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          if (timeCompare !== 0) return timeCompare;

          // Then sort alphabetically by title
          return (a.title || '').localeCompare(b.title || '');
        });
      });

      // Update the atom with the grouped events
      setUpcomingDatesMap(eventsByDate);
    } catch (error) {
      console.error('Error loading all-day events to store:', error);
      setUpcomingDatesMap({});
    }
  }

  async function loadCalendarsMap(hasCalendarsPermissions: boolean) {
    if (!hasCalendarsPermissions) {
      // TODO; handle no access
    }

    const primaryCalendar = await Calendar.getDefaultCalendarAsync();
    let calendarMap = await getCalendarsMap();

    let importantCalendar = Object.values(calendarMap).find(
      (calendar) => calendar.title === 'Important'
    );
    if (!importantCalendar) {
      await Calendar.createCalendarAsync({
        title: 'Important',
        color: 'rgb(255,56,60)',
        entityType: Calendar.EntityTypes.EVENT,
        name: 'Important',
        ownerAccount: 'PlannerApp'
      });
      calendarMap = await getCalendarsMap();
      importantCalendar = Object.values(calendarMap).find(
        (calendar) => calendar.title === 'Important'
      )!;
    }

    if (Object.keys(calendarMapInStore).length === 0) {
      setCalendarMapInStore(calendarMap);
      setPrimaryCalendar(primaryCalendar);
    }

    return calendarMap;
  }

  async function checkContactsPermissions(): Promise<boolean> {
    try {
      const { status } = await Contacts.getPermissionsAsync();
      if (status === 'undetermined') {
        const { status: newStatus } = await Contacts.requestPermissionsAsync();
        setContactsPermissions(newStatus === 'granted');
        return newStatus === 'granted';
      } else {
        setContactsPermissions(status === 'granted');
        return status === 'granted';
      }
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      setContactsPermissions(false);
      return false;
    }
  }

  async function checkCalendarPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === 'undetermined') {
        const { status: newStatus } = await Contacts.requestPermissionsAsync();
        setCalendarPermissions(newStatus === 'granted');
        return newStatus === 'granted';
      } else {
        setCalendarPermissions(status === 'granted');
        return status === 'granted';
      }
    } catch (error) {
      console.error('Error requesting calendars permission:', error);
      setCalendarPermissions(false);
      return false;
    }
  }

  function checkRootFolderExistence() {
    if (!rootFolder) {
      setRootFolder(initialRootFolder);
    }
  }

  function updateTodayDatestamp() {
    const todayDatestamp = getTodayDatestamp();
    setTodayDatestamp(todayDatestamp);
  }

  function startMidnightDatestampScheduler() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime() + 100;

    const timeoutId = setTimeout(() => {
      updateTodayDatestamp();
      const intervalId = setInterval(updateTodayDatestamp, 24 * 60 * 60 * 1000);
      return () => clearInterval(intervalId);
    }, msUntilMidnight);

    return timeoutId;
  }

  async function getAllDayEventsFromCalendarsForNextYear(
    calendarsMap: any
  ): Promise<Calendar.Event[]> {
    const startDate = new Date(`${getTodayDatestamp()}T00:00:00`);
    const endDate = new Date(`${getDatestampOneYearFromToday()}T23:59:59`);

    const allCalendarIds = Object.keys(calendarsMap);

    const allCalendarEvents = await Calendar.getEventsAsync(allCalendarIds, startDate, endDate);
    const allDayEvents = allCalendarEvents.filter((event) => event.allDay === true);

    return allDayEvents;
  }

  async function getCalendarsMap(): Promise<Record<string, Calendar.Calendar>> {
    const allCalendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const calendarMap = allCalendars.reduce(
      (acc, cal) => {
        acc[cal.id] = cal;
        return acc;
      },
      {} as Record<string, Calendar.Calendar>
    );
    return calendarMap;
  }

  return {
    appReady,
    onLoadAllDayEventsToStore: handleLoadAllDayEventsToStore,
    onLoadBaseData: handleLoadBaseData
  };
};

export default useAppInitialization;
