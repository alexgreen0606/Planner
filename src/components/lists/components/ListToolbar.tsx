import { textfieldIdAtom } from '@/atoms/textfieldId';
import useAppTheme from '@/hooks/useAppTheme';
import { TOOLBAR_HEIGHT } from '@/lib/constants/miscLayout';
import { useAtomValue } from 'jotai';
import { ReactNode } from 'react';
import { PlatformColor, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';

// ✅ 

type TListToolbarProps = {
    hide: boolean;
    iconSet: ReactNode[][];
};

const AnimatedContainer = Animated.createAnimatedComponent(View);

const ListToolbar = ({ iconSet, hide }: TListToolbarProps) => {
    const { height: keyboardHeight } = useAnimatedKeyboard();

    const textfieldId = useAtomValue(textfieldIdAtom);

    const { toolbar: { background, border } } = useAppTheme();

    const toolbarStyle = useAnimatedStyle(() => (
        { bottom: keyboardHeight.value }
    ));

    if (!textfieldId || hide) return null;

    return (
        <AnimatedContainer
            className='w-screen absolute'
            style={toolbarStyle}
        >
            <View
                className="flex-row justify-evenly flex-1 gap-4 overflow-hidden"
                style={{
                    height: TOOLBAR_HEIGHT,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderColor: PlatformColor(border),
                    backgroundColor: PlatformColor(background.color)
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
        </AnimatedContainer>
    )
}

export default ListToolbar;