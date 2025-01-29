import React from 'react';
import { View } from 'react-native';
import GenericIcon from '../../../../foundation/components/icon/GenericIcon';
import globalStyles from '../../../../foundation/theme/globalStyles';
import CustomText from '../../../../foundation/components/text/CustomText';
import colors from '../../../../foundation/theme/colors';

interface PlannerBannerProps {
    label: string;
    toggleRecurringPlannerModal: () => void;
}

const PlannerBanner = ({ label, toggleRecurringPlannerModal }: PlannerBannerProps) =>
    <View style={globalStyles.pageLabelContainer}>
        <View style={globalStyles.verticallyCentered}>
            <GenericIcon
                type='planner'
                size={26}
                color={colors.blue}
            />
            <CustomText adjustsFontSizeToFit type='pageLabel' numberOfLines={2}>
                {label}
            </CustomText>
        </View>
        <GenericIcon
            type='recurring-calendar'
            size={20}
            color={colors.grey}
            onClick={toggleRecurringPlannerModal}
        />
    </View>

export default PlannerBanner;
