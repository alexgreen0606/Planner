import { TOOLBAR_HEIGHT } from '@/constants/layout';
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

    const isKeyboardOpen = useDerivedValue(() => {
        return keyboard.state.value === 2;
    });

    return {
        keyboard,
        keyboardHeight,
        keyboardAbsoluteTop,
        isKeyboardOpen
    };
};