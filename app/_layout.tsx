import { PLANNER_SET_MODAL_PATHNAME, TIME_MODAL_PATHNAME } from '@/lib/constants/pathnames';
import { DeleteSchedulerProvider } from '@/providers/DeleteScheduler';
import { ExternalDataProvider } from '@/providers/ExternalDataProvider';
import { Stack } from 'expo-router';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';
import { getTodayDatestamp } from '@/utils/dateUtils';

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
                            name={`${TIME_MODAL_PATHNAME}/[eventId]/[triggerDatestamp]`}
                            options={{ presentation: 'modal', headerShown: false }}
                        />
                        <Stack.Screen
                            name={`${PLANNER_SET_MODAL_PATHNAME}/[plannerSetKey]`}
                            options={{ presentation: 'modal', headerShown: false }}
                        />
                    </Stack>
                </ExternalDataProvider>
            </GestureHandlerRootView>
        </DeleteSchedulerProvider>
    </JotaiProvider>
);

export default TabLayout;
