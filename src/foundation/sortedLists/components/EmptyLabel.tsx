import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import globalStyles from '../../../theme/globalStyles';
import CustomText from '../../components/text/CustomText';
import GenericIcon, { GenericIconProps } from '../../components/GenericIcon';
import { PressableProps } from 'react-native-gesture-handler';

export interface EmptyLabelProps extends PressableProps {
    label: string;
    onPress: () => void;
    iconConfig?: GenericIconProps;
    style?: ViewStyle;
    fontSize?: number;
};

const EmptyLabel = ({
    label,
    iconConfig,
    onLayout,
    onPress,
    style,
    fontSize = 14
}: EmptyLabelProps) =>
    <Pressable onLayout={onLayout} onPress={onPress} style={{ ...globalStyles.centered, ...style }}>
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
