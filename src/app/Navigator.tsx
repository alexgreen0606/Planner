import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Today from './screens/Today';
import Lists from './screens/Lists';
import { useNavigatorContext } from '../feature/navigation/services/TabsProvider';
import GenericIcon from '../foundation/ui/icon/GenericIcon';
import { SafeAreaView, StyleSheet } from 'react-native';
import globalStyles from '../foundation/theme/globalStyles';
import { NAVBAR_HEIGHT, Pages } from '../feature/navigation/navigationUtils';
import Planner from './screens/Planner';
import { Color } from '../foundation/theme/colors';

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
