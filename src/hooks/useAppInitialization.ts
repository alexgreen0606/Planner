import { calendarIdMapAtom, importantCalendarAtom, primaryCalendarAtom } from "@/atoms/calendarAtoms";
import { userAccessAtom } from "@/atoms/userAccess";
import { NULL } from "@/lib/constants/generic";
import { EAccess } from "@/lib/enums/EAccess";
import { EFolderItemType } from "@/lib/enums/EFolderItemType";
import { EStorageId } from "@/lib/enums/EStorageId";
import { EStorageKey } from "@/lib/enums/EStorageKey";
import { IFolderItem } from "@/lib/types/listItems/IFolderItem";
import { getCalendarIdToCalendarMap, getPrimaryCalendar } from "@/utils/calendarUtils";
import { useCalendarPermissions } from "expo-calendar";
import { getPermissionsAsync, requestPermissionsAsync } from "expo-contacts";
import { useFonts } from "expo-font";
import { useAtom } from "jotai";
import { useEffect } from "react";
import * as Calendar from 'expo-calendar';
import { useMMKV, useMMKVObject } from "react-native-mmkv";

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
    const folderItemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });

    const [userAccess, setUserAccess] = useAtom(userAccessAtom);
    const [primaryCalendar, setPrimaryCalendar] = useAtom(primaryCalendarAtom);
    const [importantCalendar, setImportantCalendar] = useAtom(importantCalendarAtom);
    const [calendarIdMap, setCalendarIdMap] = useAtom(calendarIdMapAtom);

    const [fontsLoaded] = useFonts({
        'RoundHeavy': require('../../assets/fonts/SF-Compact-Rounded-Heavy.otf'),
        'RoundMedium': require('../../assets/fonts/SF-Compact-Rounded-Medium.otf'),
        'Round': require('../../assets/fonts/SF-Compact-Rounded-Regular.otf'),
        'Text': require('../../assets/fonts/SF-Pro-Text-Regular.otf'),
    });

    const [rootFolder, setRootFolder] = useMMKVObject<IFolderItem>(EStorageKey.ROOT_FOLDER_KEY, folderItemStorage);

    const [calendarStatus, requestCalendarPermissions] = useCalendarPermissions();

    const areCalendarsReady = userAccess.get(EAccess.CALENDAR) === false || (
        primaryCalendar && importantCalendar && calendarIdMap
    );

    const appReady =
        fontsLoaded &&
        areCalendarsReady &&
        userAccess.get(EAccess.CALENDAR) !== undefined &&
        userAccess.get(EAccess.CONTACTS) !== undefined &&
        rootFolder;

    // Calendar permissions check.
    useEffect(() => {
        if (!calendarStatus || calendarStatus.status === 'undetermined') {
            requestCalendarPermissions();
        } else {
            setUserAccess(prev => {
                const newMap = new Map(prev);
                newMap.set(EAccess.CALENDAR, calendarStatus.status === 'granted');
                return newMap;
            });
        }
    }, [calendarStatus]);

    // Contacts permission check and root folder check.
    useEffect(() => {
        checkContactsPermissions();
        checkRootFolderExistence();
    }, []);

    // Load in the device calendars to the jotai store.
    useEffect(() => {
        if (userAccess.get(EAccess.CALENDAR)) {
            loadCalendars();
        }
    }, [userAccess]);

    async function loadCalendars() {
        const primaryCalendar = await getPrimaryCalendar();
        let calendarIdMap = await getCalendarIdToCalendarMap();
        let importantCalendar = Object.values(calendarIdMap).find(calendar => calendar.title === 'Important');

        if (!importantCalendar) {
            await Calendar.createCalendarAsync({
                title: 'Important',
                color: 'rgb(255,56,60)',
                entityType: Calendar.EntityTypes.EVENT,
                name: 'Important',
                ownerAccount: 'PlannerApp'
            });
            calendarIdMap = await getCalendarIdToCalendarMap();
            importantCalendar = Object.values(calendarIdMap).find(calendar => calendar.title === 'Important')!;
        }

        setPrimaryCalendar(primaryCalendar);
        setImportantCalendar(importantCalendar);
        setCalendarIdMap(calendarIdMap);
    }

    async function checkContactsPermissions() {
        if (userAccess.get(EAccess.CONTACTS) !== undefined) return;

        try {
            const { status } = await getPermissionsAsync();

            if (status === 'undetermined') {
                const { status: newStatus } = await requestPermissionsAsync();
                setUserAccess(prev => {
                    const newMap = new Map(prev);
                    newMap.set(EAccess.CONTACTS, newStatus === 'granted');
                    return newMap;
                });
            } else {
                setUserAccess(prev => {
                    const newMap = new Map(prev);
                    newMap.set(EAccess.CONTACTS, status === 'granted');
                    return newMap;
                });
            }
        } catch (error) {
            console.error('Error requesting contacts permission:', error);
            setUserAccess(prev => {
                const newMap = new Map(prev);
                newMap.set(EAccess.CONTACTS, false);
                return newMap;
            });
        }
    }

    function checkRootFolderExistence() {
        if (!rootFolder) {
            setRootFolder(initialRootFolder);
        }
    }

    return appReady;
};

export default useAppInitialization;