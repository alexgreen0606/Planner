import React from 'react';
import { View, ViewStyle } from 'react-native';
import GenericIcon, { GenericIconProps } from '../../../ui/icon/GenericIcon';
import CustomText from '../../../ui/text/CustomText';
import globalStyles from '../../../theme/globalStyles';

export interface EmptyLabelProps {
    label: string;
    iconConfig?: GenericIconProps;
    style?: ViewStyle;
    fontSize?: number;
}

const EmptyLabel = ({
    label,
    iconConfig,
    style,
    fontSize = 14
}: EmptyLabelProps) =>
    <View style={{ ...globalStyles.centered, ...style }}>
        <View style={globalStyles.verticallyCentered}>
            <CustomText
                type='label'
                style={{ fontSize }}
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

export default EmptyLabel;
