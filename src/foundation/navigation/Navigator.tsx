import React from 'react';
import { View } from 'react-native';
import { BOTTOM_NAVIGATION_HEIGHT, Pages } from './constants';
import GenericIcon from '../components/GenericIcon';
import { BlurView } from 'expo-blur';
import useDimensions from '../hooks/useDimensions';
import { useNavigator } from './services/NavProvider';
import Today from '../../screens/today';
import Planners from '../../screens/planners';
import Lists from '../../screens/checklists';

const Navigator = () => {

    const {
        currentTab,
        setCurrentTab
    } = useNavigator();

    const {
        screenWidth,
        bottomSpacer,
    } = useDimensions();

    return (
        <View style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
                {currentTab === Pages.DASHBOARD ? (
                    <Today />
                ) : currentTab === Pages.PLANNERS ? (
                    <Planners />
                ) : (
                    <Lists />
                )}
            </View>
            <View style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                alignItems: 'flex-end',
                width: screenWidth,
                height: BOTTOM_NAVIGATION_HEIGHT,
                position: 'absolute',
                bottom: 0,
                left: 0,
                paddingBottom: bottomSpacer - 8,
                backgroundColor: 'transparent'
            }}>
                <BlurView
                    tint='systemUltraThinMaterial'
                    intensity={100}
                    style={{
                        height: BOTTOM_NAVIGATION_HEIGHT + bottomSpacer,
                        width: screenWidth,
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                    }}
                />
                <GenericIcon
                    type='lists'
                    size='xl'
                    hideRipple
                    platformColor={currentTab === Pages.LISTS ? 'systemBlue' : 'secondaryLabel'}
                    onClick={() => setCurrentTab(Pages.LISTS)}
                />
                <GenericIcon
                    type='coffee'
                    size='xl'
                    hideRipple
                    platformColor={currentTab === Pages.DASHBOARD ? 'systemBlue' : 'secondaryLabel'}
                    onClick={() => setCurrentTab(Pages.DASHBOARD)}
                />
                <GenericIcon
                    type='planners'
                    size='xl'
                    hideRipple
                    platformColor={currentTab === Pages.PLANNERS ? 'systemBlue' : 'secondaryLabel'}
                    onClick={() => setCurrentTab(Pages.PLANNERS)}
                />
            </View>
        </View>
    );
};

export default Navigator;
