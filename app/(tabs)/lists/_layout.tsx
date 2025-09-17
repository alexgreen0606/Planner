import useAppTheme from '@/hooks/useAppTheme';
import { Stack } from 'expo-router';
import { PlatformColor } from 'react-native';

// ✅ 

const Layout = () => {
    const { background } = useAppTheme();
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: PlatformColor(background) }
            }}
        />
    )
};

export default Layout;