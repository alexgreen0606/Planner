import { EDIT_EVENT_MODAL_PATHNAME, FOLDER_ITEM_MODAL_PATHNAME, VIEW_EVENT_MODAL_PATHNAME } from '@/lib/constants/pathnames';
import { DeleteSchedulerProvider } from '@/providers/DeleteScheduler';
import { ExternalDataProvider } from '@/providers/ExternalDataProvider';
import { Stack } from 'expo-router';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';

// ✅ 

export const jotaiStore = createStore();

const TabLayout = () => (
    <JotaiProvider store={jotaiStore}>
        <DeleteSchedulerProvider>
            <GestureHandlerRootView>
                <ExternalDataProvider>
                    <Stack>
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen
                            name={`${EDIT_EVENT_MODAL_PATHNAME}/[eventId]/[triggerDatestamp]`}
                            options={{
                                presentation: 'formSheet',
                                headerShown: false,
                                contentStyle: { backgroundColor: 'transparent' },
                                sheetAllowedDetents: 'fitToContents',
                            }}
                        />
                        <Stack.Screen
                            name={`${VIEW_EVENT_MODAL_PATHNAME}/[eventId]/[triggerDatestamp]`}
                            options={{
                                presentation: 'formSheet',
                                headerShown: false,
                                sheetAllowedDetents: 'fitToContents',
                                contentStyle: { backgroundColor: 'transparent' }
                            }}
                        />
                        <Stack.Screen
                            name={`${FOLDER_ITEM_MODAL_PATHNAME}/[folderItemId]`}
                            options={{
                                presentation: 'formSheet',
                                headerShown: false,
                                contentStyle: { backgroundColor: 'transparent' },
                                sheetAllowedDetents: 'fitToContents',
                            }}
                        />
                    </Stack>
                </ExternalDataProvider>
            </GestureHandlerRootView>
        </DeleteSchedulerProvider>
    </JotaiProvider>
);

export default TabLayout;
