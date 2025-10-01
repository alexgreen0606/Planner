import { textfieldIdAtom } from '@/atoms/textfieldId';
import { TOOLBAR_HEIGHT } from '@/lib/constants/miscLayout';
import { Host, HStack } from '@expo/ui/swift-ui';
import { glassEffect } from '@expo/ui/swift-ui/modifiers';
import { useAtomValue } from 'jotai';
import { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';

// ✅ 

type TListToolbarProps = {
    hide: boolean;
    iconSet: ReactNode[][];
};

const ListToolbar = ({ iconSet, hide }: TListToolbarProps) => {
    const { height: keyboardHeight } = useAnimatedKeyboard();

    const textfieldId = useAtomValue(textfieldIdAtom);

    const toolbarStyle = useAnimatedStyle(() => (
        { bottom: keyboardHeight.value + 8 }
    ));

    if (!textfieldId || hide) return null;

    return (
        <Animated.View
            className='w-screen absolute z-[1000]'
            style={toolbarStyle}
        >
            <Host>
                <HStack modifiers={[
                    glassEffect({
                        glass: {
                            variant: 'regular'
                        }
                    })
                ]}>
                    <View
                        className="flex-row justify-evenly flex-1 gap-4 overflow-hidden"
                        style={{
                            height: TOOLBAR_HEIGHT - 8
                        }}
                    >
                        {iconSet.map((iconCluster, clusterIndex) => (
                            <View
                                key={`toolbar-cluster-${clusterIndex}`}
                                className='flex-row gap-1 items-center'
                            >
                                {iconCluster.map((icon, iconIndex) => (
                                    <View key={`toolbar-cluster-${clusterIndex}-icon-${iconIndex}`}>
                                        {icon}
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                </HStack>
            </Host>
        </Animated.View>
    )
}

export default ListToolbar;