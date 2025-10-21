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
    const { width, height } = useWindowDimensions();
    return (
        <FadeInView
            className='flex-1 absolute bottom-0 left-0 pointer-events-none items-center justify-center gap-2'
            style={{ width, height }}
        >
            {iconProps && (
                <Icon {...iconProps} />
            )}
            <Host matchContents>
                <VStack modifiers={[frame({ width })]}>
                    <Text design='rounded' weight='semibold' size={16} color={PlatformColor('tertiaryLabel') as unknown as string}>
                        {label}
                    </Text>
                </VStack>
            </Host>
        </FadeInView>
    )
};

export default EmptyPageLabel;