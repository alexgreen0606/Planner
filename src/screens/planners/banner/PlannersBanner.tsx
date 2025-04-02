import React from 'react';
import { View } from 'react-native';
import { BlurView } from 'expo-blur';
import useDimensions from '../../../foundation/hooks/useDimensions';
import { HEADER_HEIGHT } from '../../../foundation/navigation/constants';
import CustomText from '../../../foundation/components/text/CustomText';
import GenericIcon from '../../../foundation/components/GenericIcon';
import PlannerModes from '../../../feature/planner/types';
import globalStyles from '../../../foundation/theme/globalStyles';

interface PlannerBannerProps {
    mode: PlannerModes;
    setMode: (mode: PlannerModes) => void;
}

const PlannersBanner = ({ mode, setMode }: PlannerBannerProps) => {

    const {
        topSpacer,
        screenWidth
    } = useDimensions();

    return (
        <View style={{
            display: 'flex',
            position: 'absolute',
            left: screenWidth * 0.05,
            top: 0,
            width: screenWidth * 0.9,
            height: HEADER_HEIGHT,
        }
        }>
            <View style={{
                display: 'flex',
                height: '100%',
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
            }}>
                <BlurView
                    tint='systemUltraThinMaterialDark'
                    intensity={100}
                    style={{
                        position: 'absolute',
                        height: HEADER_HEIGHT,
                        width: 135,
                        top: 0,
                        left: 0,
                        borderRadius: 16,
                        overflow: 'hidden',
                    }}
                />
                <BlurView
                    tint='systemUltraThinMaterialDark'
                    intensity={100}
                    style={{
                        position: 'absolute',
                        height: HEADER_HEIGHT,
                        width: 120,
                        top: 0,
                        right: 0,
                        borderRadius: 32,
                        overflow: 'hidden',
                    }}
                />
                <CustomText type='pageLabel'>
                    {mode}
                </CustomText>
                <View style={{...globalStyles.verticallyCentered, gap: 16}}>
                    <GenericIcon
                        type='plannerStack'
                        size='l'
                        platformColor={mode === PlannerModes.PLANNERS ? 'systemBlue' : 'secondaryLabel'}
                        onClick={() => setMode(PlannerModes.PLANNERS)}
                    />
                    <GenericIcon
                        type='alert'
                        size='l'
                        platformColor={mode === PlannerModes.DEADLINES ? 'systemBlue' : 'secondaryLabel'}
                        onClick={() => setMode(PlannerModes.DEADLINES)}
                    />
                    <GenericIcon
                        type='recurringCalendar'
                        size='l'
                        platformColor={mode === PlannerModes.RECURRING ? 'systemBlue' : 'secondaryLabel'}
                        onClick={() => setMode(PlannerModes.RECURRING)}
                    />
                </View>

            </View>
        </View>
    )
}

export default PlannersBanner;
