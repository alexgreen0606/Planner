import { Tabs } from 'expo-router';
import GenericIcon from '../src/foundation/components/GenericIcon';
import { BOTTOM_NAVIGATION_HEIGHT } from '../src/foundation/navigation/constants';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DeleteSchedulerProvider } from '../src/foundation/sortedLists/services/DeleteScheduler';
import { ReloadProvider } from '../src/foundation/navigation/services/NavigationProvider';
import useDimensions from '../src/foundation/hooks/useDimensions';

export default function TabLayout() {
    const { BOTTOM_SPACER } = useDimensions();
    return (
        <PaperProvider>
            <GestureHandlerRootView>
                <DeleteSchedulerProvider>
                    <ReloadProvider>
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
                    </ReloadProvider>
                </DeleteSchedulerProvider>
            </GestureHandlerRootView>
        </PaperProvider>
    );
}
