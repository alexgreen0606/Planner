import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../../theme/theme';
import Dashboard from '../../screens/Dashboard';
import WeeklyPlanner from '../../screens/WeeklyPlanner';
import Calendar from '../../screens/Calendar';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Money from '../../screens/Money';
import { PlannersProvider } from '../../feature/planner/services/PlannersProvider';

const Tab = createBottomTabNavigator();

const routeIconMap: Record<string, 'coffee' | 'bars' | 'calendar-o' | 'money'> = {
    dashboard: 'coffee',
    planner: 'bars',
    calendar: 'calendar-o',
    money: 'money'
}

const WeeklyPlannerWithProviders = () => 
    <PlannersProvider>
        <WeeklyPlanner/>
    </PlannersProvider>

const Navigator = () => {
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
        >
            <Tab.Screen name="dashboard" component={Dashboard} />
            <Tab.Screen name="money" component={Money} />
            <Tab.Screen name="planner" component={WeeklyPlannerWithProviders} />
            <Tab.Screen name="calendar" component={Calendar} />
        </Tab.Navigator>
    );
};

export default Navigator;
