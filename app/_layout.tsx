import AuthGuard from '@/components/AccessGuard';
import { DeleteSchedulerProvider } from '@/providers/DeleteScheduler';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';
import { PlatformColor, View } from 'react-native';
import useAppTheme from '@/hooks/useAppTheme';

// ✅ 

export const jotaiStore = createStore();

const TabLayout = () => {
    const { background } = useAppTheme();
    return (
        <View className='flex-1' style={{ backgroundColor: PlatformColor(background) }}>
            <JotaiProvider store={jotaiStore}>
                <DeleteSchedulerProvider>
                    <GestureHandlerRootView>
                        <AuthGuard />
                    </GestureHandlerRootView>
                </DeleteSchedulerProvider>
            </JotaiProvider>
        </View>
    )
}

export default TabLayout;
