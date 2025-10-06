import { FOLDER_ITEM_MODAL_PATHNAME, PLANNER_SELECT_MODAL_PATHNAME, PLANNER_SET_MODAL_PATHNAME, TIME_MODAL_PATHNAME } from '@/lib/constants/pathnames';
import { DeleteSchedulerProvider } from '@/providers/DeleteScheduler';
import { ExternalDataProvider } from '@/providers/ExternalDataProvider';
import { Stack } from 'expo-router';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';
import { useTheme } from '@react-navigation/core';

// ✅ 

export const jotaiStore = createStore();

const TabLayout = () => {
    const { colors } = useTheme();
    colors.background = 'transparent';
    return (
        <JotaiProvider store={jotaiStore}>
            <DeleteSchedulerProvider>
                <GestureHandlerRootView>
                    <ExternalDataProvider>
                        <Stack screenOptions={{ presentation: 'transparentModal', animation: 'none', headerShown: false }}>
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            <Stack.Screen
                                name={`${TIME_MODAL_PATHNAME}/[eventId]/[triggerDatestamp]`}
                                options={{
                                    presentation: 'modal',
                                    headerShown: false
                                }}
                            />
                            <Stack.Screen
                                name={`${PLANNER_SET_MODAL_PATHNAME}/[plannerSetKey]`}
                                options={{
                                    presentation: 'modal',
                                    headerShown: false
                                }}
                            />
                            <Stack.Screen
                                name={`${FOLDER_ITEM_MODAL_PATHNAME}/[folderItemId]`}
                                options={{
                                    presentation: 'modal',
                                    headerShown: false
                                }}
                            />
                            <Stack.Screen
                                name={PLANNER_SELECT_MODAL_PATHNAME}
                                options={{
                                    presentation: 'transparentModal',
                                    animation: 'none',
                                    headerShown: false,
                                    contentStyle: {
                                        backgroundColor: "transparent"
                                    }
                                }}
                            />
                        </Stack>
                    </ExternalDataProvider>
                </GestureHandlerRootView>
            </DeleteSchedulerProvider>
        </JotaiProvider>
    );
};

export default TabLayout;
