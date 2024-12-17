import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../../theme/theme';
import Dashboard from '../../screens/Dashboard';
import WeeklyPlanner from '../../screens/WeeklyPlanner';
import Calendar from '../../screens/Calendar';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Money from '../../screens/Money';
import Lists from '../../screens/Lists';
import { ListProvider } from '../lists/services/ListProvider';
import { useTabsContext } from './services/TabsProvider';

const Tab = createBottomTabNavigator();

const routeIconMap: Record<string, 'coffee' | 'bars' | 'calendar-o' | 'bank' | 'folder-o'> = {
    dashboard: 'coffee',
    planner: 'bars',
    calendar: 'calendar-o',
    money: 'bank',
    folders: 'folder-o'
}

const WeeklyPlannerWithProviders = () =>
    <ListProvider>
        <WeeklyPlanner />
    </ListProvider>

const Navigator = () => {
    const { setCurrentTab } = useTabsContext();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => <FontAwesome name={routeIconMap[route.name]} size={size} style={{ color }} />,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.outline,
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.colors.background,
                    shadowOpacity: 0,
                    borderTopWidth: 0
                },
                tabBarLabelStyle: {
                    display: 'none'
                }
            })}
            initialRouteName='dashboard'
        >
            <Tab.Screen name="folders" component={Lists} listeners={{
                    focus: () => setCurrentTab('folders')
                }} />
            <Tab.Screen name="money" component={Money} listeners={{
                    focus: () => setCurrentTab('money')
                }} />
            <Tab.Screen name="dashboard" component={Dashboard} listeners={{
                    focus: () => setCurrentTab('dashboard')
                }} />
            <Tab.Screen name="planner" component={WeeklyPlannerWithProviders} listeners={{
                    focus: () => setCurrentTab('planner')
                }} />
            <Tab.Screen name="calendar" component={Calendar} listeners={{
                    focus: () => setCurrentTab('calendar')
                }} />
        </Tab.Navigator>
    );
};

export default Navigator;
