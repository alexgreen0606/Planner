import { Tabs } from 'expo-router';
import GenericIcon from '@/components/GenericIcon';
import { BOTTOM_NAVIGATION_HEIGHT, spacing } from '@/constants/layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
    const { bottom: BOTTOM_SPACER } = useSafeAreaInsets();
    return (
        <Tabs
            screenOptions={{
                tabBarStyle: {
                    height: BOTTOM_NAVIGATION_HEIGHT + BOTTOM_SPACER - spacing.medium,
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    position: 'absolute',
                },
                headerShown: false,
                tabBarActiveTintColor: 'systemBlue',
                tabBarInactiveTintColor: 'secondaryLabel',
                tabBarLabel: () => null
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
                        <GenericIcon
                            type="coffee"
                            size="xl"
                            hideRipple
                            platformColor={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="planners"
                options={{
                    tabBarIcon: ({ color }) => (
                        <GenericIcon
                            type="planners"
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
