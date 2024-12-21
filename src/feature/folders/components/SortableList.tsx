import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { theme } from '../../../theme/theme';
import { FontAwesome } from '@expo/vector-icons';
import { ListItem } from '../../../foundation/sortedLists/types';
import { ShiftTextfieldDirection, ItemStatus } from '../../../foundation/sortedLists/enums';
import useSortedList from '../../../foundation/sortedLists/hooks/useSortedList';
import { FolderItemType } from '../enums';
import LabelBanner from './LabelBanner';
import { getFolder, getList, updateListItems } from '../storage/folderStorage';
import ClickableLine from '../../../foundation/ui/separators/ClickableLine';
import ListTextfield from '../../../foundation/sortedLists/components/ListTextfield';

interface SortableListProps {
    listId: string;
    onBackClick: (parentFolderId: string) => void;
};

const SortableList = ({
    listId,
    onBackClick
}: SortableListProps) => {
    const { colors } = useTheme();
    const list = useMemo(() => getList(listId), [listId]);
    const parentFolder = getFolder(list.parentFolderId);
    const SortedList = useSortedList<ListItem>(list.items, (newItems: ListItem[]) => updateListItems(listId, newItems));

    const renderItem = useCallback((item: ListItem, drag: any) =>
        item.status && [ItemStatus.EDIT, ItemStatus.NEW].includes(item.status) ?
            <ListTextfield
                key={`${item.id}-${item.sortId}`}
                item={item}
                onChange={(text) => { SortedList.updateItem({ ...item, value: text }) }}
                onSubmit={() => SortedList.saveTextfield(ShiftTextfieldDirection.BELOW)}
            /> :
            <Text
                onLongPress={drag}
                onPress={() => SortedList.beginEditItem(item)}
                style={{
                    ...styles.listItem,
                    color: item.status && [ItemStatus.DELETE].includes(item.status) ?
                        colors.outline : colors.secondary,
                    textDecorationLine: item.status === ItemStatus.DELETE ? 'line-through' : undefined
                }}
            >
                {item.value}
            </Text>
        , [SortedList.current]);

    const renderRow = useCallback(({ item, drag }: RenderItemParams<ListItem>) => {
        const isItemDeleting = item.status === ItemStatus.DELETE;
        const iconStyle = isItemDeleting ? 'dot-circle-o' : 'circle-thin';
        return (
            <View style={{ backgroundColor: item.status === 'DRAG' ? colors.background : undefined }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FontAwesome
                        name={iconStyle}
                        size={20}
                        color={isItemDeleting ? colors.primary : colors.secondary}
                        style={{ marginLeft: 16 }}
                        onPress={() => SortedList.toggleDeleteItem(item)}
                    />
                    {renderItem(item, drag)}
                </View>
                <ClickableLine onPress={() => SortedList.moveTextfield(item.sortId)} />
            </View>
        )
    }, [SortedList.current]);

    return (
        <View>
            <LabelBanner
                dataId={list.id}
                backButtonConfig={{
                    display: !!parentFolder,
                    label: parentFolder?.value,
                    onClick: () => onBackClick(list.parentFolderId!)
                }}
                type={FolderItemType.LIST}
            />
            <View style={{ width: '100%', marginBottom: 37 }}>
                <ClickableLine onPress={() => SortedList.moveTextfield(-1)} />
                <DraggableFlatList
                    data={SortedList.current}
                    scrollEnabled={false}
                    onDragEnd={SortedList.endDragItem}
                    onDragBegin={SortedList.beginDragItem}
                    keyExtractor={(item) => item.id}
                    renderItem={renderRow}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
});

export default SortableList;