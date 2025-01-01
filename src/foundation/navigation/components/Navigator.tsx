import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Dashboard from '../../../screens/Dashboard';
import WeeklyPlanner from '../../../screens/WeeklyPlanner';
import Folders from '../../../screens/Folders';
import { PlannerProvider } from '../../../feature/planners/services/PlannerProvider';
import { useNavigatorContext } from '../services/TabsProvider';
import GenericIcon from '../../ui/icons/GenericIcon';
import colors from '../../../theme/colors';

interface IconSpecification {
    type: any;
    name: 'coffee' | 'calendar-number-sharp' | 'calendar' | 'bank' | 'folder';
}

const Tab = createBottomTabNavigator();

const routeIconMap: Record<string, IconSpecification> = {
    dashboard: { type: 'FontAwesome', name: 'coffee' },
    planner: { type: 'Ionicons', name: 'calendar-number-sharp' },
    // calendar: { type: 'FontAwesome', name: 'coffee' },
    // money: { type: 'FontAwesome', name: 'coffee' },
    folders: { type: 'Entypo', name: 'folder' }
}

const WeeklyPlannerWithProviders = () =>
    <PlannerProvider>
        <WeeklyPlanner />
    </PlannerProvider>

const Navigator = () => {
    const { setCurrentTab } = useNavigatorContext();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    const iconConfig = routeIconMap[route.name];
                    return (
                        <GenericIcon
                            type={iconConfig.type}
                            name={iconConfig.name}
                            size={size}
                            color={color}
                        />
                    )
                },
                tabBarActiveTintColor: colors.blue,
                tabBarInactiveTintColor: colors.grey,
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.black,
                    shadowOpacity: 0,
                    borderTopWidth: 0,
                    height: 80,
                    paddingTop: 10
                },
                tabBarLabelStyle: {
                    display: 'none'
                }
            })}
            initialRouteName='dashboard'
        >
            <Tab.Screen name="folders" component={Folders} listeners={{
                focus: () => setCurrentTab('folders')
            }} />
            <Tab.Screen name="dashboard" component={Dashboard} listeners={{
                focus: () => setCurrentTab('dashboard')
            }} />
            <Tab.Screen name="planner" component={WeeklyPlannerWithProviders} listeners={{
                focus: () => setCurrentTab('planner')
            }} />
            {/* <Tab.Screen name="money" component={Money} listeners={{
                focus: () => setCurrentTab('money')
            }} /> */}
            {/* <Tab.Screen name="calendar" component={Calendar} listeners={{
                    focus: () => setCurrentTab('calendar')
                }} /> */}
        </Tab.Navigator>
    );
};

export default Navigator;
