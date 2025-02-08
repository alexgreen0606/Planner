import React from 'react';
import { View } from 'react-native';
import globalStyles from '../../../foundation/theme/globalStyles';
import GenericIcon from '../../../foundation/ui/icon/GenericIcon';
import { Color } from '../../../foundation/theme/colors';
import CustomText from '../../../foundation/ui/text/CustomText';

const CountdownBanner = () =>
    <View style={globalStyles.pageLabelContainer}>
        <View style={globalStyles.verticallyCentered}>
            <GenericIcon
                type='alert'
                size={26}
                color={Color.BLUE}
            />
            <CustomText type='pageLabel'>
                Countdowns
            </CustomText>
        </View>
    </View>

export default CountdownBanner;
