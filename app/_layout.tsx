import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DeleteSchedulerProvider } from '../src/foundation/sortedLists/services/DeleteScheduler';
import { ReloadProvider } from '../src/foundation/reload/ReloadProvider';
import { TIME_MODAL_PATHNAME } from './(modals)/TimeModal';
import { TimeModalProvider } from '../src/modals/timeModal/TimeModalProvider';
import { PLANNER_SET_MODAL_PATHNAME } from './(modals)/plannerSetModal/[plannerSetKey]';

export default function TabLayout() {
    return (
        <PaperProvider>
            <GestureHandlerRootView>
                <DeleteSchedulerProvider>
                    <ReloadProvider>
                        <TimeModalProvider>
                            <Stack>
                                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                                <Stack.Screen
                                    name={TIME_MODAL_PATHNAME}
                                    options={{ presentation: 'modal', headerShown: false }}
                                />
                                <Stack.Screen
                                    name={`${PLANNER_SET_MODAL_PATHNAME}[plannerSetKey]`}
                                    options={{ presentation: 'modal', headerShown: false }}
                                />
                            </Stack>
                        </TimeModalProvider>
                    </ReloadProvider>
                </DeleteSchedulerProvider>
            </GestureHandlerRootView>
        </PaperProvider>
    );
}
