import CalendarPermissionsWrapper from '@/components/CalendarPermissionsWrapper';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import '../global.css';
import { DeleteSchedulerProvider } from '@/providers/DeleteScheduler';
import { CalendarProvider } from '@/providers/CalendarProvider';

export const jotaiStore = createStore();

export default function TabLayout() {

    return (
        <PaperProvider>
            <JotaiProvider store={jotaiStore}>
                <CalendarProvider>
                    <DeleteSchedulerProvider>
                        <GestureHandlerRootView>
                            <CalendarPermissionsWrapper />
                        </GestureHandlerRootView>
                    </DeleteSchedulerProvider>
                </CalendarProvider>
            </JotaiProvider>
        </PaperProvider>
    );
}
