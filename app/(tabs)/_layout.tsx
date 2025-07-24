import GenericIcon from '@/components/icon';
import TodayIcon from '@/components/icon/TodayIcon';
import { BOTTOM_NAVIGATION_HEIGHT } from '@/lib/constants/miscLayout';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ✅ 

export default function TabLayout() {
    const { bottom: BOTTOM_SPACER } = useSafeAreaInsets();
    return (
        <Tabs
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    position: 'absolute',
                    height: BOTTOM_NAVIGATION_HEIGHT + BOTTOM_SPACER - 10
                },
                headerShown: false,
                tabBarActiveTintColor: 'systemBlue',
                tabBarInactiveTintColor: 'secondaryLabel',
                tabBarLabel: () => null
            }}
            safeAreaInsets={{
                bottom: 0
            }}
        >
            <Tabs.Screen
                name="lists"
                options={{
                    tabBarIcon: ({ color }) => (
                        <GenericIcon
                            type="lists"
                            size="xl"
                            hideRipple
                            platformColor={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ color }) => (
                        <TodayIcon platformColor={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="planners"
                options={{
                    tabBarIcon: ({ color }) => (
                        <GenericIcon
                            type="calendar"
                            size="xl"
                            hideRipple
                            platformColor={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
