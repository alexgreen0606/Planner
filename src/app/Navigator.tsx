import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Today from './screens/today';
import Lists from './screens/checklists';
import { SafeAreaView, StyleSheet } from 'react-native';
import globalStyles from '../foundation/theme/globalStyles';
import { Pages } from './navUtils';
import Planners from './screens/planners';
import { Palette } from '../foundation/theme/colors';
import { useNavigatorContext } from './NavProvider';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import GenericIcon, { IconType } from '../foundation/components/GenericIcon';
import { BANNER_HEIGHT } from '../foundation/components/constants';

const Tab = createBottomTabNavigator();

const routeIconMap: Record<string, IconType> = {
    [Pages.DASHBOARD]: 'coffee',
    [Pages.PLANNERS]: 'planners',
    [Pages.LISTS]: 'lists',
    [Pages.DEADLINES]: 'alert'
};

const Navigator = () => {
    const { setCurrentTab } = useNavigatorContext();
    return (
        <SafeAreaView style={globalStyles.blackFilledSpace}>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ color }) =>
                        <TouchableWithoutFeedback>
                            <GenericIcon
                                type={routeIconMap[route.name]}
                                size='xl'
                                color={color}
                            />
                        </TouchableWithoutFeedback>,
                    tabBarActiveTintColor: Palette.BLUE,
                    tabBarInactiveTintColor: Palette.DIM,
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: Palette.BLACK,
                        shadowOpacity: 0,
                        paddingTop: 8,
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: Palette.DIM,
                        height: BANNER_HEIGHT
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
                <Tab.Screen name={Pages.PLANNERS} component={Planners} listeners={{
                    focus: () => setCurrentTab(Pages.PLANNERS)
                }} />
            </Tab.Navigator>
        </SafeAreaView>
    );
};

export default Navigator;
