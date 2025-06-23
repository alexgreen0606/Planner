import AuthGuard from '@/components/AccessGuard';
import { DeleteSchedulerProvider } from '@/providers/DeleteScheduler';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';

export const jotaiStore = createStore();

export default function TabLayout() {

    return (
        <JotaiProvider store={jotaiStore}>
            <DeleteSchedulerProvider>
                <GestureHandlerRootView>
                    <AuthGuard />
                </GestureHandlerRootView>
            </DeleteSchedulerProvider>
        </JotaiProvider>
    );
}
