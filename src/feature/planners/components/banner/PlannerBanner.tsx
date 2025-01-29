import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import colors from '../../../../foundation/theme/colors';
import GenericIcon, { GenericIconProps } from '../../../../foundation/components/icons/GenericIcon';
import globalStyles from '../../../../foundation/theme/globalStyles';
import CustomText from '../../../../foundation/components/text/CustomText';

interface PageLabelProps {
    label: string;
    iconConfig: GenericIconProps;
    controlConfig?: GenericIconProps;
    control?: () => void;
}

const PlannerBanner = ({ label, iconConfig, controlConfig, control }: PageLabelProps) =>
    <View style={styles.container}>
        <View style={globalStyles.verticallyCentered}>
            <GenericIcon
                {...iconConfig}
            />
            <CustomText adjustsFontSizeToFit type='pageLabel' numberOfLines={2}>
                {label}
            </CustomText>
        </View>
        {controlConfig && (
            <TouchableOpacity
                onPress={control}
            >
                <GenericIcon
                    {...controlConfig}
                />
            </TouchableOpacity>
        )}
    </View>

const styles = StyleSheet.create({
    container: {
        ...globalStyles.pageLabelContainer,
        borderBottomColor: colors.grey,
        borderBottomWidth: StyleSheet.hairlineWidth,
        paddingBottom: 7.5
    }
});

export default PlannerBanner;
