import { userAccessAtom } from "@/atoms/userAccess";
import { NULL } from "@/lib/constants/generic";
import { PLANNER_SET_MODAL_PATHNAME, TIME_MODAL_PATHNAME } from "@/lib/constants/pathnames";
import { EAccess } from "@/lib/enums/EAccess";
import { EItemStatus } from "@/lib/enums/EItemStatus";
import { EListType } from "@/lib/enums/EListType";
import { EStorageId } from "@/lib/enums/EStorageId";
import { EStorageKey } from "@/lib/enums/EStorageKey";
import { IFolder } from "@/lib/types/checklists/IFolder";
import { CalendarProvider } from "@/providers/CalendarProvider";
import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import { useFonts } from 'expo-font';
import { Stack } from "expo-router";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { useMMKV, useMMKVObject } from "react-native-mmkv";

// ✅ 

const initialRootFolder: IFolder = {
    id: EStorageKey.ROOT_FOLDER_KEY,
    listId: NULL,
    folderIds: [],
    listIds: [],
    value: 'Lists',
    sortId: 1,
    platformColor: 'systemBlue',
    status: EItemStatus.STATIC,
    listType: EListType.FOLDER
};

/**
 * Handles setup of app, including access requests and initializing storage objects.
 */
const AccessGuard = () => {
    const [userAccess, setUserAccess] = useAtom(userAccessAtom);

    const storage = useMMKV({ id: EStorageId.CHECKLISTS });
    const [rootFolder, setRootFolder] = useMMKVObject<IFolder>(EStorageKey.ROOT_FOLDER_KEY, storage);

    const [calendarStatus, requestCalendarPermissions] = Calendar.useCalendarPermissions();

    const [fontsLoaded] = useFonts({
        'RoundHeavy': require('../../assets/fonts/SF-Compact-Rounded-Heavy.otf'),
        'RoundMedium': require('../../assets/fonts/SF-Compact-Rounded-Medium.otf'),
        'Round': require('../../assets/fonts/SF-Compact-Rounded-Regular.otf'),
        'Text': require('../../assets/fonts/SF-Pro-Text-Regular.otf'),
    });

    const appReady =
        fontsLoaded &&
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

    // =======================
    // 1. Helper Functions
    // =======================

    async function checkContactsPermissions() {
        if (userAccess.get(EAccess.CONTACTS) !== undefined) return;

        try {
            const { status } = await Contacts.getPermissionsAsync();

            if (status === 'undetermined') {
                const { status: newStatus } = await Contacts.requestPermissionsAsync();
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

    // =======================
    // 2. UI
    // =======================

    return appReady && (
        <CalendarProvider>
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name={`${TIME_MODAL_PATHNAME}[datestamp]/[eventId]/[sortId]/[eventValue]`}
                    options={{ presentation: 'modal', headerShown: false }}
                />
                <Stack.Screen
                    name={`${PLANNER_SET_MODAL_PATHNAME}[plannerSetKey]`}
                    options={{ presentation: 'modal', headerShown: false }}
                />
            </Stack>
        </CalendarProvider>
    );
};

export default AccessGuard;