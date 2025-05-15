import { DimensionsProvider } from '@/services/DimensionsProvider';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import '../global.css';
import { DeleteSchedulerProvider } from '../src/services/DeleteScheduler';
import { ReloadProvider } from '../src/services/ReloadProvider';
import { PLANNER_SET_MODAL_PATHNAME } from './(modals)/plannerSetModal/[plannerSetKey]';
import { TIME_MODAL_PATHNAME } from './(modals)/TimeModal';
import { TimeModalProvider } from '@/components/modal/services/TimeModalProvider';

export default function TabLayout() {
    return (
        <PaperProvider>
            <DimensionsProvider>
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
            </DimensionsProvider>
        </PaperProvider>
    );
}
