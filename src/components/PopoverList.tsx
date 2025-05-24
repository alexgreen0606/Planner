import React, { useEffect, useRef, useState } from 'react';
import { PlatformColor, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Portal } from 'react-native-paper';
import ButtonText from './text/ButtonText';
import CustomText from './text/CustomText';
import { LIST_ITEM_HEIGHT } from '@/constants/layout';

const PopoverContainer = Animated.createAnimatedComponent(View);
const BackdropContainer = Animated.createAnimatedComponent(View);

const POPOVER_WIDTH = 200;

interface PopoverProps<T> {
    options: T[];
    onChange: (newValue: T) => void;
    getLabelFromObject: (object: T) => string;
}

const PopoverList = <T,>({
    options,
    onChange,
    getLabelFromObject
}: PopoverProps<T>) => {
    const selectedValueRef = useRef<View>(null);
    const [value, setValue] = useState(options[0]);
    const [isOpen, setIsOpen] = useState(false);
    const popoverVisibility = useSharedValue(0); // animated between 0 and 1
    const selectedValueMeasurements = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });

    // Animate the closing and opening of the popover
    useEffect(() => {
        popoverVisibility.value = withTiming(
            isOpen ? 1 : 0,
            { duration: 300 }
        );
    }, [isOpen]);

    // ------------- Utility Functions -------------

    function handleOpenPopover() {
        selectedValueRef.current?.measureInWindow((x, y, width, height) => {
            selectedValueMeasurements.value = { x, y, width, height };
        });
        setIsOpen(true);
    }

    function handleSelectOption(option: T) {
        setValue(option);
        onChange(option);
        setIsOpen(false);
    }

    // ------------- Animated Styles -------------

    const popoverContainerStyle = useAnimatedStyle(() => {
        const { x, y, height } = selectedValueMeasurements.value;
        const scale = popoverVisibility.value;

        return {
            transform: [
                { translateX: -POPOVER_WIDTH / 2 },
                { scale },
                { translateX: POPOVER_WIDTH / 2 },
                { translateY: height }
            ],
            top: y,
            left: x,
        };
    });

    const backdropContainerStyle = useAnimatedStyle(() => ({
        opacity: popoverVisibility.value
    }));

    return (
        <View>

            {/* Selected Value / Popover Trigger */}
            <View ref={selectedValueRef}>
                <ButtonText onClick={handleOpenPopover}>
                    {getLabelFromObject(value)}
                </ButtonText>
            </View>

            <Portal>

                {/* Backdrop */}
                <BackdropContainer style={backdropContainerStyle}>
                    <Pressable onPress={() => setIsOpen(false)}>
                        <BlurView
                            intensity={50}
                            className='w-screen h-screen'
                        />
                    </Pressable>
                </BackdropContainer>

                {/* Popover List */}
                <PopoverContainer
                    style={[
                        popoverContainerStyle,
                        styles.popoverContainer
                    ]}
                >

                    {/* Blurred List Background */}
                    <BlurView
                        intensity={100}
                        tint='systemUltraThinMaterialDark'
                        className='h-screen'
                        style={styles.popoverBlur}
                    />

                    {/* List Options */}
                    {options.map((option, i) =>
                        <TouchableOpacity
                            key={`${i}-${option}`}
                            onPress={() => handleSelectOption(option)}
                            style={[
                                styles.listItem,
                                { borderTopWidth: i !== 0 ? StyleSheet.hairlineWidth : 0 }
                            ]}
                        >
                            <CustomText type='standard'>
                                {getLabelFromObject(option)}
                            </CustomText>
                        </TouchableOpacity>
                    )}

                </PopoverContainer>

            </Portal>
        </View>
    )
}

const styles = StyleSheet.create({
    popoverContainer: {
        position: 'absolute',
        zIndex: 3000,
        overflow: 'hidden',
        width: POPOVER_WIDTH,
        borderRadius: 8,
    },
    popoverBlur: {
        position: 'absolute',
        width: POPOVER_WIDTH,
        top: 0,
        left: 0
    },
    listItem: {
        minHeight: LIST_ITEM_HEIGHT,
        width: POPOVER_WIDTH,
        justifyContent: 'center',
        padding: 8,
        borderTopColor: PlatformColor('systemGray')
    }
});

export default PopoverList;
