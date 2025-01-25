import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Dashboard from '../../../screens/Dashboard';
import Planner from '../../../screens/Planner';
import Lists from '../../../screens/Lists';
import { useNavigatorContext } from '../services/TabsProvider';
import GenericIcon from '../../components/icons/GenericIcon';
import colors from '../../theme/colors';
import { SafeAreaView, StyleSheet } from 'react-native';
import globalStyles from '../../theme/globalStyles';
import { NAVBAR_HEIGHT, Pages } from '../utils';

const Tab = createBottomTabNavigator();

const routeIconMap: Record<string, string> = {
    [Pages.DASHBOARD]: 'dashboard',
    [Pages.PLANNER]: 'planner',
    [Pages.LISTS]: 'lists'
}

const Navigator = () => {
    const { setCurrentTab } = useNavigatorContext();
    return (
        <SafeAreaView style={globalStyles.blackFilledSpace}>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ color, size }) =>
                        <GenericIcon
                            type={routeIconMap[route.name]}
                            size={size}
                            color={color}
                        />,
                    tabBarActiveTintColor: colors.blue,
                    tabBarInactiveTintColor: colors.grey,
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: colors.black,
                        shadowOpacity: 0,
                        paddingTop: 8,
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: colors.grey,
                        height: NAVBAR_HEIGHT
                    },
                    tabBarLabelStyle: {
                        display: 'none'
                    }
                })}
                initialRouteName={Pages.DASHBOARD}
            >
                <Tab.Screen name={Pages.LISTS} component={Lists} listeners={{
                    focus: () => setCurrentTab(Pages.LISTS)
                }} />
                <Tab.Screen name={Pages.DASHBOARD} component={Dashboard} listeners={{
                    focus: () => setCurrentTab(Pages.DASHBOARD)
                }} />
                <Tab.Screen name={Pages.PLANNER} component={Planner} listeners={{
                    focus: () => setCurrentTab(Pages.PLANNER)
                }} />
            </Tab.Navigator>
        </SafeAreaView>
    );
};

export default Navigator;
