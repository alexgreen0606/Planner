import React from 'react';
import { View } from 'react-native';
import globalStyles from '../../../../foundation/theme/globalStyles';
import CustomText from '../../../../foundation/components/text/CustomText';
import PlannerModes from '../../../../feature/planner/types';
import GenericIcon from '../../../../foundation/components/GenericIcon';
import { BANNER_HEIGHT } from '../../../../foundation/components/constants';

interface PlannerBannerProps {
    mode: PlannerModes;
    setMode: (mode: PlannerModes) => void;
}

const PlannersBanner = ({ mode, setMode }: PlannerBannerProps) =>
    <View style={{ height: BANNER_HEIGHT }}>
        <View style={globalStyles.pageLabelContainer}>
            <View style={globalStyles.verticallyCentered}>
                <CustomText type='pageLabel'>
                    {mode}
                </CustomText>
            </View>
            <View style={globalStyles.verticallyCentered}>
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

export default PlannersBanner;
