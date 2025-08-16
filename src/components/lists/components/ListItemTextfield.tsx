import CustomText from '@/components/text/CustomText';
import { LIST_CONTENT_HEIGHT, LIST_ICON_SPACING, LIST_ITEM_HEIGHT } from '@/lib/constants/listConstants';
import { EItemStatus } from '@/lib/enums/EItemStatus';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { isItemTextfield } from '@/utils/listUtils';
import React, { useMemo } from 'react';
import { PlatformColor, TextInput, TextStyle, View } from 'react-native';
import ListToolbar, { ToolbarIcon } from './ListToolbar';

//

type TListItemTextfieldProps<T extends TListItem> = {
    item: T;
    toolbarIconSet?: ToolbarIcon<T>[][];
    hideKeyboard: boolean;
    customStyle: TextStyle;
    onSetItemInStorage: (value: T | ((prevValue: T | undefined) => T | undefined) | undefined) => void;
    onCreateChildTextfield: () => void;
    onDeleteItem: (item: T) => void;
    onValueChange?: (newText: string, prev: T) => T;
    onSaveToExternalStorage?: (item: T) => void;
};

const ListItemTextfield = <T extends TListItem>({
    item,
    toolbarIconSet,
    hideKeyboard,
    customStyle,
    onSetItemInStorage,
    onSaveToExternalStorage,
    onValueChange,
    onDeleteItem,
    onCreateChildTextfield
}: TListItemTextfieldProps<T>) => {

    const isEditable = useMemo(() => isItemTextfield(item), [item.status]);

    function handleValueChange(newText: string) {
        onSetItemInStorage((prev) => {
            if (!prev) return prev;

            if (onValueChange) {
                return onValueChange(newText, prev);
            }

            return { ...prev, value: newText };
        });
    }

    function handleBlurTextfield() {
        if (item.value.trim() === '') {
            onDeleteItem(item);
            return;
        }

        onSetItemInStorage((prev) => {
            if (!prev) return prev;

            const staticEvent = { ...prev, status: EItemStatus.STATIC };
            onSaveToExternalStorage?.(staticEvent);
            return staticEvent;
        });
    }

    function handleSubmitTextfield() {
        if (item.value.trim() === '') {
            onDeleteItem(item);
            return;
        }

        onCreateChildTextfield();
    }

    if (!item) return null;

    if (isEditable) {
        return (
            <View>
                <TextInput
                    value={item.value}
                    autoFocus
                    inputAccessoryViewID={item.id}
                    submitBehavior='submit'
                    selectionColor={PlatformColor('systemBlue')}
                    returnKeyType='done'
                    className='flex-1 bg-transparent text-[16px] w-full absolute pr-2'
                    style={[
                        {
                            height: LIST_CONTENT_HEIGHT,
                            marginRight: LIST_ICON_SPACING / 2,
                            color: PlatformColor('label'),
                            fontFamily: 'Text',
                        },
                        customStyle
                    ]}
                    onChangeText={handleValueChange}
                    onSubmitEditing={handleSubmitTextfield}
                    onBlur={handleBlurTextfield}
                />
                {toolbarIconSet && <ListToolbar item={item} iconSets={toolbarIconSet} accessoryKey={item.id} />}
            </View>
        )
    }

    return (
        <CustomText
            variant='standard'
            className='flex-1 bg-transparent text-[16px] w-full absolute pr-2'
            style={[
                {
                    height: LIST_ITEM_HEIGHT,
                    paddingTop: LIST_CONTENT_HEIGHT / 8,
                    marginRight: LIST_ICON_SPACING / 2,
                    color: PlatformColor('label'),
                    fontFamily: 'Text',
                },
                customStyle
            ]}
        >
            {item.value}
        </CustomText>
    )
}

export default ListItemTextfield;
