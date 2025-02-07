import React from 'react';
import { View } from 'react-native';
import GenericIcon from '../../../../foundation/ui/icon/GenericIcon';
import globalStyles from '../../../../foundation/theme/globalStyles';
import CustomText from '../../../../foundation/ui/text/CustomText';
import { Color } from '../../../../foundation/theme/colors';
import ThinLine from '../../../../foundation/ui/separator/ThinLine';

interface PlannerBannerProps {
    label: string;
    toggleRecurringPlannerModal: () => void;
}

const PlannerBanner = ({ label, toggleRecurringPlannerModal }: PlannerBannerProps) =>
    <View>
        <View style={globalStyles.pageLabelContainer}>
            <View style={globalStyles.verticallyCentered}>
                <GenericIcon
                    type='planner'
                    size={26}
                    color={Color.BLUE}
                />
                <CustomText type='pageLabel'>
                    {label}
                </CustomText>
            </View>
            <GenericIcon
                type='recurring-calendar'
                size={20}
                color={Color.DIM}
                onClick={toggleRecurringPlannerModal}
            />
        </View>
        <ThinLine centerLine={false} />
    </View>

export default PlannerBanner;
