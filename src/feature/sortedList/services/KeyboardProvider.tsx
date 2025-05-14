import { TOOLBAR_HEIGHT } from '@/constants/size';
import { useDimensions } from '@/services/DimensionsProvider';
import React, { createContext, useContext } from 'react';
import {
    AnimatedKeyboardInfo,
    DerivedValue,
    useAnimatedKeyboard,
    useDerivedValue
} from 'react-native-reanimated';

interface KeyboardContextValue {
    keyboard: AnimatedKeyboardInfo;
    keyboardHeight: DerivedValue<number>;
    keyboardAbsoluteTop: DerivedValue<number>;
    isKeyboardOpen: DerivedValue<boolean>;
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
        return keyboard.height.value + TOOLBAR_HEIGHT;
    });

    const keyboardAbsoluteTop = useDerivedValue(() => {
        return SCREEN_HEIGHT - keyboardHeight.value;
    });

    const isKeyboardOpen = useDerivedValue(() => {
        return keyboard.state.value === 2;
    });

    return (
        <KeyboardContext.Provider
            value={{
                keyboard,
                keyboardHeight,
                keyboardAbsoluteTop,
                isKeyboardOpen
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