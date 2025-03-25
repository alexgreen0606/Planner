import React, { useEffect, useMemo, useRef } from 'react';
import { PlatformColor, StyleSheet, TextInput, TextStyle } from 'react-native';
import { ListItem } from '../types';
import { useSortableListContext } from '../services/SortableListProvider';
import { runOnJS, SharedValue, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { useKeyboard } from '../services/KeyboardProvider';
import { LIST_ITEM_HEIGHT } from '../constants';

interface ListTextfieldProps<T extends ListItem> {
    item: T;
    onChange: (newText: string) => void;
    onSubmit: () => void;
    toggleBlur: boolean;
    customStyle: TextStyle;
    isLoadingInitialPosition: SharedValue<boolean>;
}

const ListTextfield = <T extends ListItem>({
    item,
    onChange,
    onSubmit,
    isLoadingInitialPosition,
    toggleBlur,
    customStyle,
}: ListTextfieldProps<T>) => {
    const inputRef = useRef<TextInput>(null);
    const isFocused = useSharedValue(false);
    const textfieldBottom = useSharedValue<number>(0);

    const {
        currentTextfield,
        previousTextfieldId,
        setPreviousTextfieldId,
        scrollOffset,
        disableNativeScroll
    } = useSortableListContext();

    const {
        isKeyboardOpen,
        keyboardAbsoluteTop,
        scrollTextfieldIntoView
    } = useKeyboard();

    const editable = useMemo(() => {
        const isEditable = [previousTextfieldId, currentTextfield?.id].includes(item.id);

        if (!isEditable) {
            isFocused.value = false;
        }

        return isEditable;
    }, [previousTextfieldId, currentTextfield?.id, item.id]);

    // ---------- Scroll Logic ----------

    const evaluateBottomPosition = () => {
        inputRef.current?.measureInWindow((_, y) => {
            textfieldBottom.value = y + LIST_ITEM_HEIGHT;
        });
    }

    // Evaluate position of textfield after initialization
    useAnimatedReaction(
        () => isLoadingInitialPosition.value,
        (loading) => {
            if (!loading) {
                runOnJS(evaluateBottomPosition)();
            }
        }
    )

    // Scroll the textfield into view
    useAnimatedReaction(
        () => ({
            shouldCheck: isFocused.value &&
                !isLoadingInitialPosition.value &&
                isKeyboardOpen.value,
            textfieldBottom: textfieldBottom.value,
            keyboardTop: keyboardAbsoluteTop.value
        }),
        (data) => {
            if (data.shouldCheck && data.textfieldBottom > data.keyboardTop) {
                scrollTextfieldIntoView(
                    textfieldBottom,
                    scrollOffset,
                    disableNativeScroll
                );
            }
        }
    );

    // ---------- Focus Logic ----------

    // Focus the textfield when clicked and evaluate position
    useEffect(() => {
        if (currentTextfield?.id === item.id && !isFocused.value) {
            setTimeout(() => {
                inputRef.current?.focus();
                isFocused.value = true;

                // Evaluate in case item has moved since initial render
                evaluateBottomPosition();

                // Trigger the previous textfield to become static
                setPreviousTextfieldId(undefined);
            }, 50);
        }
    }, [currentTextfield?.id]);

    // Manual Focus and Blur
    useEffect(() => {
        if (toggleBlur) {
            inputRef.current?.blur();
        } else {
            inputRef.current?.focus();
        }
    }, [toggleBlur]);

    return (
        <TextInput
            ref={inputRef}
            value={item.value}
            submitBehavior='submit'
            editable={editable}
            onChangeText={onChange}
            selectionColor={PlatformColor('systemTeal')}
            style={{ ...styles.textInput, ...customStyle }}
            onSubmitEditing={onSubmit}
        />
    )
}

const styles = StyleSheet.create({
    textInput: {
        backgroundColor: 'transparent',
        color: PlatformColor('label'),
        paddingVertical: 1,
        flex: 1,
        height: 25,
        fontSize: 16,
        paddingLeft: 16,
    },
});

export default ListTextfield;
