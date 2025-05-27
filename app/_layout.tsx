import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import '../global.css';
import { PLANNER_SET_MODAL_PATHNAME } from './(modals)/plannerSetModal/[plannerSetKey]';
import { TimeModalProvider } from '@/services/TimeModalProvider';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { TIME_MODAL_PATHNAME } from './(modals)/timeModal/[datestamp]/[eventId]/[sortId]/[eventValue]';

export const jotaiStore = createStore();

export default function TabLayout() {
    return (
        <PaperProvider>
            <JotaiProvider store={jotaiStore}>
                <GestureHandlerRootView>
                    <TimeModalProvider>
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
                    </TimeModalProvider>
                </GestureHandlerRootView>
            </JotaiProvider>
        </PaperProvider>
    );
}
