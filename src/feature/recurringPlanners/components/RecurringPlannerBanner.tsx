import React from 'react';
import { View } from 'react-native';
import CustomText from '../../../foundation/components/text/CustomText';
import globalStyles from '../../../foundation/theme/globalStyles';

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
