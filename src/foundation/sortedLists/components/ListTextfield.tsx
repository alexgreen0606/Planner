import React, { useEffect, useMemo, useRef } from 'react';
import { PlatformColor, StyleSheet, TextInput, TextStyle } from 'react-native';
import { ListItem } from '../types';
import { useSortableList } from '../services/SortableListProvider';
import { runOnJS, SharedValue, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { useKeyboard } from '../services/KeyboardProvider';
import { LIST_CONTENT_HEIGHT, LIST_ICON_SPACING, LIST_ITEM_HEIGHT } from '../constants';

interface ListTextfieldProps<T extends ListItem> {
    item: T;
    onChange: (newText: string) => void;
    onSubmit: (blurred: boolean) => void;
    isAwaitingInitialPosition: SharedValue<boolean>;
    hideKeyboard: boolean;
    customStyle: TextStyle;
}

const ListTextfield = <T extends ListItem>({
    item,
    onChange,
    onSubmit,
    isAwaitingInitialPosition,
    hideKeyboard,
    customStyle,
}: ListTextfieldProps<T>) => {

    const {
        currentTextfield,
        pendingItem,
        setCurrentTextfield,
        scrollOffset,
        disableNativeScroll
    } = useSortableList();

    const {
        isKeyboardOpen,
        keyboardAbsoluteTop,
        scrollTextfieldIntoView
    } = useKeyboard();

    const inputRef = useRef<TextInput>(null);
    const isFocused = useSharedValue(false);
    const absoluteBottom = useSharedValue<number>(0);

    // Ensures textfield will only save once, whether blurred or entered
    const hasSaved = useRef(false);

    /**
     * Determine if the textfield can be edited.
     * During transition between two textfields, both will be editable. This allows the device keyboard
     * to be remain open.
     * Once the new textfield is focused, the previous one will become un-editable.
     */
    const editable = useMemo(() => {
        const isEditable = [pendingItem?.id, currentTextfield?.id].includes(item.id) && !hideKeyboard;
        if (!isEditable) isFocused.value = false;

        return isEditable;
    }, [pendingItem, currentTextfield?.id, item.id, hideKeyboard]);

    // ------------- Utility Function -------------

    function evaluateAbsoluteBottom() {
        inputRef.current?.measureInWindow((_, y) => {
            absoluteBottom.value = y + LIST_ITEM_HEIGHT;
        });
    }

    function handleInputChange(newVal: string) {
        evaluateAbsoluteBottom();
        onChange(newVal);
    }

    function handleSave(createNew: boolean) {
        if (hasSaved.current) return;
        hasSaved.current = true;

        onSubmit(createNew);
    }

    // ---------- Scroll Handler ----------

    // Evaluate position of textfield after initialization
    useAnimatedReaction(
        () => isAwaitingInitialPosition.value,
        (loading) => {
            if (!loading) {
                runOnJS(evaluateAbsoluteBottom)();
            }
        }
    )

    // Scroll the textfield into view
    useAnimatedReaction(
        () => ({
            shouldCheck: isFocused.value && isKeyboardOpen.value,
            textfieldBottom: absoluteBottom.value,
            keyboardTop: keyboardAbsoluteTop.value
        }),
        (data) => {
            if (data.shouldCheck && data.textfieldBottom > data.keyboardTop) {
                scrollTextfieldIntoView(
                    absoluteBottom,
                    scrollOffset,
                    disableNativeScroll
                );
            }
        }
    );

    // ---------- Focus Handler ----------

    // Focus the textfield when clicked and evaluate its position
    useEffect(() => {
        if (currentTextfield?.id === item.id && !isFocused.value) {
            setTimeout(() => {
                inputRef.current?.focus();
                isFocused.value = true;
                hasSaved.current = false;

                // Evaluate in case item has moved since initial render
                evaluateAbsoluteBottom();

                // Trigger the previous textfield to become static
                setCurrentTextfield(currentTextfield)
            }, 50);
        }
    }, [currentTextfield?.id]);

    return (
        <TextInput
            ref={inputRef}
            value={item.value}
            editable={editable}
            onChangeText={handleInputChange}
            onSubmitEditing={() => handleSave(true)}
            onBlur={() => handleSave(false)}
            submitBehavior='submit'
            selectionColor={PlatformColor('systemBlue')}
            style={[styles.textInput, customStyle]}
        />
    )
}

const styles = StyleSheet.create({
    textInput: {
        flex: 1,
        height: LIST_CONTENT_HEIGHT,
        marginRight: LIST_ICON_SPACING / 2,
        fontSize: 16,
        color: PlatformColor('label'),
        backgroundColor: 'transparent',
    },
});

export default ListTextfield;
