import React from 'react';
import { View } from 'react-native';
import globalStyles from '../../../../foundation/theme/globalStyles';
import CustomText from '../../../../foundation/components/text/CustomText';
import { Palette } from '../../../../foundation/theme/colors';
import PlannerModes from '../../../../feature/planner/types';
import GenericIcon from '../../../../foundation/components/GenericIcon';
import ThinLine from '../../../../foundation/components/ThinLine';
import { BANNER_HEIGHT } from '../../../../foundation/components/constants';

interface PlannerBannerProps {
    mode: PlannerModes;
    setMode: (mode: PlannerModes) => void;
}

const PlannersBanner = ({ mode, setMode }: PlannerBannerProps) =>
    <View>
        <View style={globalStyles.pageLabelContainer}>
            <View style={globalStyles.verticallyCentered}>
                <GenericIcon
                    type='planners'
                    size='xl'
                    color={Palette.BLUE}
                />
                <CustomText type='pageLabel'>
                    {mode}
                </CustomText>
            </View>
            <View style={globalStyles.verticallyCentered}>
                <GenericIcon
                    type='plannerStack'
                    size='l'
                    color={mode === PlannerModes.PLANNERS ? Palette.BLUE : Palette.DIM}
                    onClick={() => setMode(PlannerModes.PLANNERS)}
                />
                <GenericIcon
                    type='alert'
                    size='l'
                    color={mode === PlannerModes.DEADLINES ? Palette.BLUE : Palette.DIM}
                    onClick={() => setMode(PlannerModes.DEADLINES)}
                />
                <GenericIcon
                    type='recurringCalendar'
                    size='l'
                    color={mode === PlannerModes.RECURRING ? Palette.BLUE : Palette.DIM}
                    onClick={() => setMode(PlannerModes.RECURRING)}
                />
            </View>
        </View>
        {mode !== PlannerModes.DEADLINES && <ThinLine centerLine={false} />}
    </View>

export default PlannersBanner;
