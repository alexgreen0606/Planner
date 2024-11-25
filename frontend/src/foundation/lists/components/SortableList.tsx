import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { theme } from '../../../theme/theme';
import { getNewSortId } from '../../../feature/planner/utils';
import { FontAwesome } from '@expo/vector-icons';
import { CreateItemPayload, ListItem } from '../types';
import useSortedList from '../hooks/useSortedList';

interface UpdateConfig<T extends ListItem> {
    type: 'edit' | 'new' | 'drag';
    initialData?: T;
    newData?: T; // TODO: set this up
    parentSortId?: number;
};


const INITIALIZED_LIST_ITEM = {
    id: '',
    sortId: 1.0,
    value: ''
}

interface SortableListProps<T extends ListItem> {
    listId: string;
    listItems: T[];
    currentOpenTextfield: string | undefined;
    createDbItem: (payload: CreateItemPayload) => Promise<T | null>;
    updateDbItem: (data: T) => Promise<T | null>;
    deleteDbItem: (data: T) => Promise<T | null>;
    handleOpenTextfield: () => void;
};

const PENDING_ITEM_ID = 'PENDING_ITEM_ID';

// TODO: moving the input field of an edited item should hide the original one - or do we delete it?
// TODO: prevent editing while update in progress
// TODO: handle line click ignore if above item is a textfield
// TODO: refresh list when api fails -> then no need to handle failed api responses?

const SortableList = <T extends ListItem>({
    listItems,
    createDbItem,
    updateDbItem,
    listId,
    handleOpenTextfield,
    deleteDbItem,
    currentOpenTextfield
}: SortableListProps<T>) => {
    const { colors } = useTheme();
    const [updateConfig, setUpdateConfig] = useState<UpdateConfig<T> | undefined>(undefined);
    const [userInput, setUserInput] = useState<string>('');
    const SortedList = useSortedList<T>(listItems);

    const resetState = (parentSortId?: number | undefined) => {
        let newConfig = undefined;
        if (parentSortId)
            newConfig = {
                parentSortId,
                type: "new"
            } as UpdateConfig<T>
        setUpdateConfig(newConfig);
        setUserInput('');
    };

    const handleLineClick = (parentSortId: number) => {
        if (parentSortId !== updateConfig?.parentSortId) {
            if (updateConfig?.initialData) {
                // Somehow need to mark that the item has moved: handleListUpdate needs to have the new edit value's sort id???
            }
            setUpdateConfig({ type: 'new', initialData: undefined, parentSortId });
            handleOpenTextfield();
        }
    };

    const handleItemClick = async (item: T) => {
        if (userInput)
            await handleListUpdate();

        setUpdateConfig({ initialData: item, type: 'edit' });
        setUserInput(item.value);
        handleOpenTextfield();
    };

    const toggleDeleteItem = (item: T, immediate?: boolean) => {
        const newItem = {
            ...item,
            pendingDelete: !item.pendingDelete
        }
        SortedList.updateItem(newItem);

        if (newItem.pendingDelete) {
            setTimeout(async () => {
                const response = await deleteDbItem(item);
                if (response === null) {
                    // If delete failed, revert the item's pendingDelete status
                    SortedList.updateItem({ ...newItem, pendingDelete: false });
                } else {
                    // If delete succeeded, remove the item from the list
                    SortedList.deleteItem(item.id);
                }
            }, immediate ? 0 : 3000);
        }
    };

    const handleListUpdate = async () => {
        let apiResponse: T | null = null;
        if (updateConfig) {
            if (updateConfig.initialData) {
                // We're editing an existing item
                const originalItem = updateConfig.initialData;

                if (userInput.trim() === '') {
                    toggleDeleteItem(updateConfig.initialData, true);
                } else if (userInput !== originalItem.value) {
                    // Update the existing item if the input has changed
                    const pendingListItem = {
                        ...originalItem,
                        value: userInput
                    };
                    const tempListItem = {
                        ...pendingListItem,
                        id: PENDING_ITEM_ID
                    };
                    SortedList.updateItem(tempListItem, pendingListItem.id);
                    apiResponse = await updateDbItem(pendingListItem);

                    if (apiResponse === null) {
                        // If update failed, revert to the original item
                        SortedList.updateItem(originalItem, PENDING_ITEM_ID);
                    } else {
                        // If update succeeded, use the response
                        SortedList.updateItem(apiResponse, PENDING_ITEM_ID);
                    }
                }
            } else if (!!updateConfig.parentSortId && userInput.trim().length) {
                // Create a new item (only if input is not empty)
                const sortId = getNewSortId(updateConfig.parentSortId, SortedList.current)
                SortedList.createItem({
                    id: PENDING_ITEM_ID,
                    sortId,
                    value: userInput,
                } as T);
                apiResponse = await createDbItem({ value: userInput, sortId });

                if (apiResponse === null) {
                    // If create failed, remove the pending item
                    SortedList.deleteItem(PENDING_ITEM_ID);
                } else {
                    // If create succeeded, update with the actual new item
                    SortedList.updateItem(apiResponse, PENDING_ITEM_ID);
                }
            }
        }
        resetState(apiResponse?.sortId);
    };

    const handleDragEnd = async ({ data, from, to }: { data: T[]; from: number; to: number }) => {
        if (from !== to && updateConfig?.initialData) {
            const movedItem = updateConfig.initialData
            const originalSortId = movedItem.sortId;
            const newParentSortId = to > 0 ?
                data[to - 1]?.sortId :
                -1
            const newSortId = getNewSortId(newParentSortId, SortedList.current);
            const newListItem = {
                ...movedItem,
                sortId: newSortId,
            };
            SortedList.moveItem(newListItem);
            const response = await updateDbItem(newListItem);

            if (response === null) {
                // If update failed, revert the item to its original position
                SortedList.moveItem({ ...movedItem, sortId: originalSortId });
            } else {
                // If update succeeded, use the response
                SortedList.updateItem(response as T);
            }
            resetState();
        }
    };

    const handleDragBegin = (index: number) => {
        setUpdateConfig({
            initialData: SortedList.current[index],
            type: 'drag'
        })
    }

    /**
     * Save the current input and clear the textfield when user opens a new textfield elsewhere.
     */
    useEffect(() => {
        if (currentOpenTextfield !== listId)
            handleListUpdate();
    }, [currentOpenTextfield])

    const renderClickableLine = (parentSortId: number | null) =>
        <TouchableOpacity style={styles.clickableLine} onPress={parentSortId ? () => handleLineClick(parentSortId) : undefined}>
            <View style={styles.thinLine} />
        </TouchableOpacity>

    const renderInputField = () =>
        <View>
            <TextInput
                mode="flat"
                autoFocus
                value={userInput}
                onChangeText={(text) => setUserInput(text)}
                selectionColor="white"
                style={styles.textInput}
                theme={{
                    colors: {
                        text: 'white',
                        primary: 'transparent',
                    },
                }}
                underlineColor='transparent'
                textColor='white'
                onSubmitEditing={() => handleListUpdate()}
            />
            {updateConfig?.type === 'new' && renderClickableLine(null)}
        </View>

    const renderItem = useCallback((item: T, drag: any, isActive: boolean) => {
        const isFieldBeingEditted = (item.id === updateConfig?.initialData?.id) && (updateConfig?.type === 'edit');

        return isFieldBeingEditted ?
            renderInputField() :
            <Text
                onLongPress={drag}
                onPress={() => handleItemClick(item)}
                style={{
                    ...styles.listItem,
                    color: (item.id === PENDING_ITEM_ID || item.pendingDelete) ?
                        colors.outline : colors.secondary,
                    textDecorationLine: item.pendingDelete ? 'line-through' : undefined
                }}
            >
                {item.value}
            </Text>
    }, [updateConfig, SortedList.current, userInput]);

    const renderRow = useCallback(({ item, drag, isActive }: RenderItemParams<T>) => {
        const iconStyle = item.pendingDelete ? 'dot-circle-o' : 'circle-thin'
        return (
            <View style={{ backgroundColor: updateConfig?.initialData?.id === item.id ? colors.background : undefined }}>
                {updateConfig?.initialData?.id === item.id && updateConfig.type === 'drag' && renderClickableLine(null)}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FontAwesome
                        name={iconStyle}
                        size={20}
                        color={item.pendingDelete ? colors.primary : colors.secondary}
                        style={{ marginLeft: 16 }}
                        onPress={() => toggleDeleteItem(item)}
                    />
                    {renderItem(item, drag, isActive)}
                </View>
                {renderClickableLine(item.sortId)}
                {updateConfig?.parentSortId === item.sortId && renderInputField()}
            </View>
        )
    }, [updateConfig, userInput]);

    return (
        <View style={{ width: '100%', marginBottom: 37 }}>
            {renderClickableLine(-1)}
            {updateConfig?.parentSortId === -1 && renderInputField()}
            <DraggableFlatList
                data={SortedList.current}
                scrollEnabled={false}
                onDragEnd={handleDragEnd}
                onDragBegin={handleDragBegin}
                keyExtractor={(item) => item.id}
                renderItem={renderRow}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    clickableLine: {
        width: '100%',
        height: 15,
        backgroundColor: 'transparent',
        justifyContent: 'center'
    },
    thinLine: {
        width: '100%',
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.colors.outline,
    },
    listItem: {
        width: '100%',
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 4,
        paddingBottom: 4,
        minHeight: 25,
        color: theme.colors.secondary,
        fontSize: 16
    },
    textInput: {
        backgroundColor: 'transparent',
        color: 'white',
        paddingTop: 1,
        paddingBottom: 1,
        width: '100%',
        height: 25,
        fontSize: 16
    },
});

export default SortableList;