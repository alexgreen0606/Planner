import { userAccessAtom } from "@/atoms/userAccess";
import { NULL } from "@/lib/constants/generic";
import { PLANNER_SET_MODAL_PATHNAME, TIME_MODAL_PATHNAME } from "@/lib/constants/pathnames";
import { EAccess } from "@/lib/enums/EAccess";
import { EFolderItemType } from "@/lib/enums/EFolderItemType";
import { EStorageId } from "@/lib/enums/EStorageId";
import { EStorageKey } from "@/lib/enums/EStorageKey";
import { IFolderItem } from "@/lib/types/listItems/IFolderItem";
import { ExternalDataProvider } from "@/providers/ExternalDataProvider";
import { useCalendarPermissions } from "expo-calendar";
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-contacts';
import { useFonts } from 'expo-font';
import { Stack } from "expo-router";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { useMMKV, useMMKVObject } from "react-native-mmkv";

// ✅ 

const initialRootFolder: IFolderItem = {
    id: EStorageKey.ROOT_FOLDER_KEY,
    listId: NULL,
    itemIds: [],
    value: 'Lists',
    platformColor: 'systemBlue',
    type: EFolderItemType.FOLDER,
    storageId: EStorageId.FOLDER_ITEM
};

/**
 * Handles setup of app, including access requests and initializing storage objects.
 */
const AccessGuard = () => {
    const folderItemStorage = useMMKV({ id: EStorageId.FOLDER_ITEM });

    const [userAccess, setUserAccess] = useAtom(userAccessAtom);

    const [fontsLoaded] = useFonts({
        'RoundHeavy': require('../../assets/fonts/SF-Compact-Rounded-Heavy.otf'),
        'RoundMedium': require('../../assets/fonts/SF-Compact-Rounded-Medium.otf'),
        'Round': require('../../assets/fonts/SF-Compact-Rounded-Regular.otf'),
        'Text': require('../../assets/fonts/SF-Pro-Text-Regular.otf'),
    });

    const [rootFolder, setRootFolder] = useMMKVObject<IFolderItem>(EStorageKey.ROOT_FOLDER_KEY, folderItemStorage);

    const [calendarStatus, requestCalendarPermissions] = useCalendarPermissions();

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

    return appReady && (
        <ExternalDataProvider>
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name={`${TIME_MODAL_PATHNAME}/[eventId]/[triggerDatestamp]`}
                    options={{ presentation: 'modal', headerShown: false }}
                />
                <Stack.Screen
                    name={`${PLANNER_SET_MODAL_PATHNAME}/[plannerSetKey]`}
                    options={{ presentation: 'modal', headerShown: false }}
                />
            </Stack>
        </ExternalDataProvider>
    )
};

export default AccessGuard;