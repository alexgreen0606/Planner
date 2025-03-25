import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Today from './screens/today';
import Lists from './screens/checklists';
import { PlatformColor, SafeAreaView, TouchableOpacity, View } from 'react-native';
import globalStyles from '../foundation/theme/globalStyles';
import { Pages } from './navUtils';
import Planners from './screens/planners';
import { useNavigatorContext } from './NavProvider';
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
        <View style={{ flex: 1 }}>
            <SafeAreaView style={globalStyles.blackFilledSpace}>
                <Tab.Navigator
                    screenOptions={({ route, navigation }) => ({
                        tabBarIcon: ({ focused }) =>
                            <TouchableOpacity onPress={() => navigation.navigate(route.name)}>
                                <GenericIcon
                                    type={routeIconMap[route.name]}
                                    size='xl'
                                    platformColor={focused ? 'systemBlue' : 'secondaryLabel'}
                                />
                            </TouchableOpacity>,
                        headerShown: false,
                        tabBarStyle: {
                            backgroundColor: PlatformColor('systemBackground'),
                            shadowOpacity: 0,
                            paddingTop: 8,
                            borderTopColor: PlatformColor('systemBackground'),
                            height: BANNER_HEIGHT
                        },
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
        </View>
    );
};

export default Navigator;
