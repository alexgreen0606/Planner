import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Today from '../../../feature/today';
import Lists from '../../../feature/lists';
import { useNavigatorContext } from '../services/TabsProvider';
import GenericIcon from '../../components/icon/GenericIcon';
import { SafeAreaView, StyleSheet } from 'react-native';
import globalStyles from '../../theme/globalStyles';
import { NAVBAR_HEIGHT, Pages } from '../utils';
import Planner from '../../../feature/planner';
import { Color } from '../../theme/colors';

const Tab = createBottomTabNavigator();

const routeIconMap: Record<string, string> = {
    [Pages.DASHBOARD]: 'coffee',
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
                    tabBarActiveTintColor: Color.BLUE,
                    tabBarInactiveTintColor: Color.DIM,
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: Color.BLACK,
                        shadowOpacity: 0,
                        paddingTop: 8,
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: Color.DIM,
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
                <Tab.Screen name={Pages.DASHBOARD} component={Today} listeners={{
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
