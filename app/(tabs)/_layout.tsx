import { Tabs } from 'expo-router';
import GenericIcon from '@/components/GenericIcon';
import { BOTTOM_NAVIGATION_HEIGHT } from '@/constants/size';
import { useDimensions } from '@/services/DimensionsProvider';

export default function TabLayout() {
    const { BOTTOM_SPACER } = useDimensions();
    return (
        <Tabs
            screenOptions={{
                tabBarStyle: {
                    height: BOTTOM_NAVIGATION_HEIGHT + BOTTOM_SPACER,
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    position: 'absolute',
                    paddingTop: 8
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
