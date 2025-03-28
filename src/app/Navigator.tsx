import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Today from './screens/today';
import Lists from './screens/checklists';
import { PlatformColor, useWindowDimensions, View } from 'react-native';
import globalStyles from '../foundation/theme/globalStyles';
import { Pages } from './navUtils';
import Planners from './screens/planners';
import { useNavigatorContext } from './NavProvider';
import GenericIcon, { IconType } from '../foundation/components/GenericIcon';
import { BANNER_HEIGHT } from '../foundation/components/constants';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Navigator = () => {
    const { setCurrentTab, currentTab } = useNavigatorContext();
    const { width } = useWindowDimensions();
    const { bottom } = useSafeAreaInsets();

    return (
        <View style={{ flex: 1 }}>
            <View style={{
                ...globalStyles.verticallyCentered,
                justifyContent: 'space-evenly',
                position: 'absolute',
                bottom: 0,
                width,
                zIndex: 10,
                height: bottom * 2,
                backgroundColor: PlatformColor('systemBackground'),
                paddingBottom: bottom / 2
            }}>
                {/* <BlurView
                    tint='default'
                    style={{
                        height: BANNER_HEIGHT + bottom,
                        width,
                        position: 'absolute',
                        left: 0
                    }} /> */}
                <GenericIcon
                    type='lists'
                    size='xl'
                    platformColor={currentTab === Pages.LISTS ? 'systemBlue' : 'secondaryLabel'}
                    onClick={() => setCurrentTab(Pages.LISTS)}
                />
                <GenericIcon
                    type='coffee'
                    size='xl'
                    platformColor={currentTab === Pages.DASHBOARD ? 'systemBlue' : 'secondaryLabel'}
                    onClick={() => setCurrentTab(Pages.DASHBOARD)}
                />
                <GenericIcon
                    type='planners'
                    size='xl'
                    platformColor={currentTab === Pages.PLANNERS ? 'systemBlue' : 'secondaryLabel'}
                    onClick={() => setCurrentTab(Pages.PLANNERS)}
                />
            </View>
            {currentTab === Pages.DASHBOARD ? (
                <Today/>
            ) : currentTab === Pages.PLANNERS ? (
                <Planners/>
            ) : (
                <Lists/>
            )}
        </View>
    );
};

export default Navigator;
