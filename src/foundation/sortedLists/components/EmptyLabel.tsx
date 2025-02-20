import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import globalStyles from '../../theme/globalStyles';
import CustomText from '../../components/text/CustomText';
import GenericIcon, { GenericIconProps } from '../../components/GenericIcon';

export interface EmptyLabelProps {
    label: string;
    onPress: () => void;
    iconConfig?: GenericIconProps;
    style?: ViewStyle;
    fontSize?: number;
};

const EmptyLabel = ({
    label,
    iconConfig,
    onPress,
    style,
    fontSize = 14
}: EmptyLabelProps) =>
    <Pressable onPress={onPress} style={{ ...globalStyles.centered, ...style }}>
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
    </Pressable>

export default EmptyLabel;
