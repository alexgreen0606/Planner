import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import GenericIcon, { GenericIconProps } from '../../../components/icon/GenericIcon';
import CustomText from '../../../components/text/CustomText';
import globalStyles from '../../../theme/globalStyles';

export interface EmptyLabelProps {
    label: string;
    iconConfig?: GenericIconProps;
    style?: ViewStyle;
    customFontSize?: number;
}

const EmptyLabel = ({
    label,
    iconConfig,
    style,
    customFontSize = 14
}: EmptyLabelProps) =>
    <View style={{ ...styles.container, ...style }}>
        <View style={globalStyles.verticallyCentered}>
            <CustomText
                type='label'
                style={{
                    fontSize: customFontSize
                }}
            >
                {label}
            </CustomText>
            {iconConfig && (
                <GenericIcon
                    {...iconConfig}
                />
            )}
        </View>
    </View>

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center'
    },
});

export default EmptyLabel;
