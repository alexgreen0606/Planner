import React, { useEffect, useMemo, useRef } from 'react';
import { PlatformColor, StyleSheet, TextInput, TextStyle } from 'react-native';
import { ListItem } from '../types';
import { useSortableList } from '../services/SortableListProvider';
import { runOnJS, SharedValue, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { useKeyboard } from '../services/KeyboardProvider';
import { LIST_ITEM_HEIGHT } from '../constants';

interface ListTextfieldProps<T extends ListItem> {
    item: T;
    onChange: (newText: string) => void;
    onSubmit: (blurred: boolean) => void;
    hideKeyboard: boolean;
    customStyle: TextStyle;
    isLoadingInitialPosition: SharedValue<boolean>;
}

const ListTextfield = <T extends ListItem>({
    item,
    onChange,
    onSubmit,
    isLoadingInitialPosition,
    hideKeyboard,
    customStyle,
}: ListTextfieldProps<T>) => {
    const inputRef = useRef<TextInput>(null);
    const hasSaved = useRef(false);
    const isFocused = useSharedValue(false);
    const textfieldBottom = useSharedValue<number>(0);

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

    const editable = useMemo(() => {
        const isEditable = [pendingItem?.id, currentTextfield?.id].includes(item.id) && !hideKeyboard;
        
        if (!isEditable) {
            isFocused.value = false;
        }

        return isEditable;
    }, [pendingItem, currentTextfield?.id, item.id, hideKeyboard]);

    function handleSave(createNew: boolean) {
        if (hasSaved.current) return; 
        hasSaved.current = true;

        onSubmit(createNew);
    }

    // ---------- Scroll Logic ----------

    const evaluateBottomPosition = () => {
        inputRef.current?.measureInWindow((_, y) => {
            textfieldBottom.value = y + LIST_ITEM_HEIGHT;
        });
    };

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
                hasSaved.current = false;

                // Evaluate in case item has moved since initial render
                evaluateBottomPosition();

                // Trigger the previous textfield to become static
                setCurrentTextfield(currentTextfield)
            }, 50);
        }
    }, [currentTextfield?.id]);

    return (
        <TextInput
            ref={inputRef}
            value={item.value}
            submitBehavior='submit'
            editable={editable}
            onChangeText={onChange}
            selectionColor={PlatformColor('systemBlue')}
            style={{ ...styles.textInput, ...customStyle }}
            onSubmitEditing={() => handleSave(true)}
            onBlur={() => handleSave(false)}
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
