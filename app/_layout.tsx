import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import '../global.css';
import { DeleteSchedulerProvider } from '../src/services/DeleteScheduler';
import { ReloadProvider } from '../src/services/ReloadScheduler';
import { PLANNER_SET_MODAL_PATHNAME } from './(modals)/plannerSetModal/[plannerSetKey]';
import { TIME_MODAL_PATHNAME } from './(modals)/TimeModal';
import { TimeModalProvider } from '@/services/TimeModalProvider';
import { Provider } from 'jotai';
import { jotaiStore } from '@/atoms/jotaiStore';

export default function TabLayout() {
    return (
        <PaperProvider>
            <Provider store={jotaiStore}>
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
            </Provider>
        </PaperProvider>
    );
}
