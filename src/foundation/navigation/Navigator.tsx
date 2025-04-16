import React from 'react';
import { View } from 'react-native';
import { BOTTOM_NAVIGATION_HEIGHT, Screens } from './constants';
import GenericIcon from '../components/GenericIcon';
import { BlurView } from 'expo-blur';
import useDimensions from '../hooks/useDimensions';
import { useNavigation } from './services/NavigationProvider';
import Today from '../../screens/today';
import Planners from '../../screens/planners';
import Lists from '../../screens/checklists';

const Navigator = () => {

    const {
        currentScreen: currentTab,
        setCurrentScreen: setCurrentTab
    } = useNavigation();

    const {
        screenWidth,
        bottomSpacer,
    } = useDimensions();

    return (
        <View style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>

                {/* Screens */}
                {currentTab === Screens.DASHBOARD ? (
                    <Today />
                ) : currentTab === Screens.LISTS ? (
                    <Lists />
                ) : (
                    <Planners />
                )}

            </View>

            {/* Bottom Navbar */}
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

                {/* Blurred Background */}
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
                    platformColor={currentTab === Screens.LISTS ? 'systemBlue' : 'secondaryLabel'}
                    onClick={() => setCurrentTab(Screens.LISTS)}
                />
                <GenericIcon
                    type='coffee'
                    size='xl'
                    hideRipple
                    platformColor={currentTab === Screens.DASHBOARD ? 'systemBlue' : 'secondaryLabel'}
                    onClick={() => setCurrentTab(Screens.DASHBOARD)}
                />
                <GenericIcon
                    type='planners'
                    size='xl'
                    hideRipple
                    platformColor={currentTab === Screens.PLANNERS ? 'systemBlue' : 'secondaryLabel'}
                    onClick={() => setCurrentTab(Screens.PLANNERS)}
                />
                
            </View>
        </View>
    );
};

export default Navigator;
