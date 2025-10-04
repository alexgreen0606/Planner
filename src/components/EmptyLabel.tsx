import { Host, Text, VStack } from '@expo/ui/swift-ui';
import { frame } from '@expo/ui/swift-ui/modifiers';
import React from 'react';
import { PlatformColor, useWindowDimensions } from 'react-native';
import Icon, { TIconProps } from './icons/Icon';
import FadeInView from './views/FadeInView';

// ✅ 

export type TEmptyPageLabelProps = {
    label: string;
    iconProps?: TIconProps;
};

const EmptyPageLabel = ({
    label,
    iconProps
}: TEmptyPageLabelProps) => {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    return (
        <FadeInView className='absolute top-1/2 -translate-y-1/2 pointer-events-none flex-column gap-2'>
            {iconProps && (
                <Icon {...iconProps} />
            )}
            <Host matchContents>
                <VStack modifiers={[frame({ width: SCREEN_WIDTH })]}>
                    <Text design='rounded' weight='semibold' size={16} color={PlatformColor('tertiaryLabel') as unknown as string}>
                        {label}
                    </Text>
                </VStack>
            </Host>
        </FadeInView>
    )
};

export default EmptyPageLabel;