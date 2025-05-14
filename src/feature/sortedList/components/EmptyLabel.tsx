import GenericIcon, { GenericIconProps } from '@/components/GenericIcon';
import React from 'react';
import { Pressable, View } from 'react-native';
import { PressableProps } from 'react-native-gesture-handler';
import CustomText from '../../../components/text/CustomText';
import globalStyles from '../../../theme/globalStyles';

export interface EmptyLabelProps extends PressableProps {
    label: string;
    onPress: () => void;
    iconConfig?: GenericIconProps;
    className?: string;
    fontSize?: number;
};

const EmptyLabel = ({
    label,
    iconConfig,
    onLayout,
    onPress,
    className,
    fontSize = 14
}: EmptyLabelProps) =>
    <Pressable
        onLayout={onLayout}
        onPress={onPress}
        className={`flex items-center justify-center ${className}`}
    >
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
