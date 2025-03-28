import React from 'react';
import Today from './screens/today';
import Lists from './screens/checklists';
import { View } from 'react-native';
import globalStyles from '../foundation/theme/globalStyles';
import { Pages } from './navUtils';
import Planners from './screens/planners';
import { useNavigator } from './NavProvider';
import GenericIcon from '../foundation/components/GenericIcon';
import { BlurView } from 'expo-blur';
import useDimensions from '../foundation/hooks/useDimensions';

const Navigator = () => {

    const { 
        currentTab,
        setCurrentTab 
    } = useNavigator();

    const {
        screenWidth,
        bottomSpacer
    } = useDimensions();

    return (
        <View style={{ flex: 1 }}>
            <View style={{
                ...globalStyles.verticallyCentered,
                justifyContent: 'space-evenly',
                position: 'absolute',
                bottom: bottomSpacer,
                left: screenWidth * .1,
                width: screenWidth * .8,
                height: bottomSpacer * 1.5,
                borderRadius: 16,
                zIndex: 4
            }}>
                <BlurView
                    tint='systemUltraThinMaterialDark'
                    intensity={100}
                    style={{
                        position: 'absolute',
                        height: bottomSpacer * 1.5,
                        width: screenWidth * .8,
                        bottom: 0,
                        left: 0,
                        borderRadius: 16,
                        overflow: 'hidden',
                    }}
                />
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
                <Today />
            ) : currentTab === Pages.PLANNERS ? (
                <Planners />
            ) : (
                <Lists />
            )}
        </View>
    );
};

export default Navigator;
