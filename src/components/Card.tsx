import { useScrollContainer } from '@/providers/ScrollContainer';
import { MotiView } from 'moti';
import React, { ReactNode } from 'react';
import { PlatformColor, View, ViewStyle } from 'react-native';
import { runOnUI } from 'react-native-reanimated';

interface CardProps {
    header?: ReactNode;
    footer?: ReactNode;
    style?: ViewStyle;
    contentHeight: number;
    collapsed: boolean;
    children: ReactNode;
}

const Card = ({
    header,
    footer,
    style,
    collapsed = false,
    contentHeight,
    children,
}: CardProps) => {
    const { measureContentHeight } = useScrollContainer();
    return (
        <View
            className='relative rounded-xl'
            style={[
                { backgroundColor: PlatformColor('systemGray6') },
                style
            ]}
        >
            {header && (
                <View className='p-2'>
                    {header}
                </View>
            )}
            <MotiView
                className='overflow-hidden'
                animate={{
                    maxHeight: contentHeight ? (collapsed ? 0 : contentHeight) : undefined
                }}
                transition={{
                    type: 'timing',
                    duration: 300
                }}
                onDidAnimate={runOnUI(measureContentHeight)}
            >
                {children}
                {footer && (
                    <View className='p-2'>
                        {footer}
                    </View>
                )}
            </MotiView>
        </View>
    )
}

export default Card;
