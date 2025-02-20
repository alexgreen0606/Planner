import React from 'react';
import { View } from 'react-native';
import globalStyles from '../../../../foundation/theme/globalStyles';
import CustomText from '../../../../foundation/ui/text/CustomText';

interface RecurringPlannerBannerProps {
    title: string;
}

const RecurringPlannerBanner = ({ title }: RecurringPlannerBannerProps) =>
    <View style={globalStyles.spacedApart}>
        <CustomText type='header'>
            {title}
        </CustomText>
    </View>

export default RecurringPlannerBanner;
