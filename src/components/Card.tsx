import { MotiView } from 'moti';
import React, { ReactNode } from 'react';
import { PlatformColor, View, ViewStyle } from 'react-native';

// ✅ 

type TCardProps = {
    header?: ReactNode;
    footer?: ReactNode;
    style?: ViewStyle;
    contentHeight: number;
    collapsed: boolean;
    children: ReactNode;
};

const Card = ({
    header,
    footer,
    style,
    collapsed = false,
    contentHeight,
    children,
}: TCardProps) => (
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
                    height: collapsed ? 0 : contentHeight
                }}
                transition={{
                    type: 'timing',
                    duration: 400
                }}
            >
                {children}
            </MotiView>
            <MotiView
                className='overflow-hidden'
                animate={{
                    maxHeight: collapsed ? 0 : 60
                }}
                transition={{
                    type: 'timing',
                    duration: 400
                }}
            >
                {footer && (
                    <View className='p-2'>
                        {footer}
                    </View>
                )}
            </MotiView>
        </View>
    );

export default Card;
