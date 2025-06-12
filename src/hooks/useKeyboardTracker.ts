import { TOOLBAR_HEIGHT } from '@/lib/constants/layout';
import { useWindowDimensions } from 'react-native';
import {
    useAnimatedKeyboard,
    useDerivedValue
} from 'react-native-reanimated';

export const useKeyboardTracker = () => {
    const keyboard = useAnimatedKeyboard();

    const { height: SCREEN_HEIGHT } = useWindowDimensions();

    const keyboardHeight = useDerivedValue(() => {
        return keyboard.height.value + TOOLBAR_HEIGHT;
    });

    const keyboardAbsoluteTop = useDerivedValue(() => {
        return SCREEN_HEIGHT - keyboardHeight.value;
    });

    const isKeyboardVisible = useDerivedValue(() => {
        return [1, 2, 3].includes(keyboard.state.value)
    });

    const isKeyboardOpen = useDerivedValue(() => {
        return 2 === keyboard.state.value
    });

    return {
        keyboard,
        keyboardHeight,
        keyboardAbsoluteTop,
        isKeyboardVisible,
        isKeyboardOpen
    };
};