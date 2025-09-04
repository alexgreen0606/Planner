import AuthGuard from '@/components/AccessGuard';
import { DeleteSchedulerProvider } from '@/providers/DeleteScheduler';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';
import { Host } from 'react-native-portalize';

// ✅ 

export const jotaiStore = createStore();

const TabLayout = () =>
    <JotaiProvider store={jotaiStore}>
        <DeleteSchedulerProvider>
            <GestureHandlerRootView>
                <Host>
                    <AuthGuard />
                </Host>
            </GestureHandlerRootView>
        </DeleteSchedulerProvider>
    </JotaiProvider>;

export default TabLayout;
