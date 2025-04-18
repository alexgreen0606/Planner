import React from 'react';
import { View } from 'react-native';
import { BOTTOM_NAVIGATION_HEIGHT, Screens } from './constants';
import GenericIcon from '../components/GenericIcon';
import useDimensions from '../hooks/useDimensions';
import { useNavigation } from './services/NavigationProvider';
import Today from '../../screens/today';
import Planners from '../../screens/planners';
import Lists from '../../screens/checklists';

const Navigator = () => {

    const {
        currentScreen,
        setCurrentScreen,
    } = useNavigation();

    const {
        screenWidth,
        bottomSpacer,
    } = useDimensions();

    return (
        <View style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>

                {/* Screens */}
                {currentScreen === Screens.DASHBOARD ? (
                    <Today />
                ) : currentScreen === Screens.LISTS ? (
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
                <GenericIcon
                    type='lists'
                    size='xl'
                    hideRipple
                    platformColor={currentScreen === Screens.LISTS ? 'systemBlue' : 'secondaryLabel'}
                    onClick={() => setCurrentScreen(Screens.LISTS)}
                />
                <GenericIcon
                    type='coffee'
                    size='xl'
                    hideRipple
                    platformColor={currentScreen === Screens.DASHBOARD ? 'systemBlue' : 'secondaryLabel'}
                    onClick={() => setCurrentScreen(Screens.DASHBOARD)}
                />
                <GenericIcon
                    type='planners'
                    size='xl'
                    hideRipple
                    platformColor={currentScreen === Screens.PLANNERS ? 'systemBlue' : 'secondaryLabel'}
                    onClick={() => setCurrentScreen(Screens.PLANNERS)}
                />
            </View>
        </View>
    );
};

export default Navigator;
