import React, { createContext, useContext } from 'react';
import {
    useAnimatedKeyboard,
    useDerivedValue,
    DerivedValue,
    AnimatedKeyboardInfo,
    SharedValue,
    withSpring,
} from 'react-native-reanimated';
import { LIST_ITEM_TOOLBAR_HEIGHT } from '../constants';
import { LIST_SPRING_CONFIG } from '../constants';
import { useDimensions } from '@/services/DimensionsProvider';

interface KeyboardContextValue {
    keyboard: AnimatedKeyboardInfo;
    keyboardHeight: DerivedValue<number>;
    keyboardAbsoluteTop: DerivedValue<number>;
    isKeyboardOpen: DerivedValue<boolean>;
    scrollTextfieldIntoView: (
        textfieldBottom: SharedValue<number>,
        scrollOffset: SharedValue<number>,
        disableNativeScroll: SharedValue<boolean>
    ) => void;
}

const KeyboardContext = createContext<KeyboardContextValue | null>(null);

interface KeyboardProviderProps {
    children: React.ReactNode;
}

export const KeyboardProvider: React.FC<KeyboardProviderProps> = ({ children }) => {

    const keyboard = useAnimatedKeyboard();

    const {
        SCREEN_HEIGHT
    } = useDimensions();

    const keyboardHeight = useDerivedValue(() => {
        return keyboard.height.value + LIST_ITEM_TOOLBAR_HEIGHT;
    });

    const keyboardAbsoluteTop = useDerivedValue(() => {
        return SCREEN_HEIGHT - keyboardHeight.value;
    });

    const isKeyboardOpen = useDerivedValue(() => {
        return keyboard.state.value === 2;
    });

    // TODO: after brief typing, the textfield moves up slightly -> not scrolling enough sometimes

    /**
     * Calculates and applies scrolling to keep a textfield visible above the keyboard
     * 
     * @param textfieldBottom The bottom Y coordinate of the textfield
     * @param scrollOffset The current scroll offset shared value
     * @param disableNativeScroll The shared value to disable native scrolling
     */
    const scrollTextfieldIntoView = (
        textfieldBottom: SharedValue<number>,
        scrollOffset: SharedValue<number>,
        disableNativeScroll: SharedValue<boolean>
    ) => {
        'worklet';
        const scrollAmount = textfieldBottom.value - keyboardAbsoluteTop.value;

        disableNativeScroll.value = true;
        scrollOffset.value = withSpring(
            scrollOffset.value + scrollAmount,
            LIST_SPRING_CONFIG,
            () => {
                textfieldBottom.value -= scrollAmount;
                disableNativeScroll.value = false;
            }
        );
    };

    return (
        <KeyboardContext.Provider
            value={{
                keyboard,
                keyboardHeight,
                keyboardAbsoluteTop,
                isKeyboardOpen,
                scrollTextfieldIntoView
            }}
        >
            {children}
        </KeyboardContext.Provider>
    );
};

export const useKeyboard = () => {
    const context = useContext(KeyboardContext);
    if (!context) {
        throw new Error("useKeyboard must be used within a KeyboardProvider");
    }
    return context;
};