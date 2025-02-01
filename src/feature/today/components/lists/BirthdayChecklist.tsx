import React, { useState } from 'react';
import { BIRTHDAY_CHECKLIST_ID } from '../../utils';
import { getTodayTimestamp } from '../../../../foundation/planners/timeUtils';
import { isItemDeleting, ItemStatus, ListItem } from '../../../../foundation/sortedLists/utils';
import useSortedList from '../../../../foundation/sortedLists/hooks/useSortedList';
import { buildBirthdayChecklist } from '../../storage/birthdayStorage';
import { StyleSheet, View } from 'react-native';
import globalStyles from '../../../../foundation/theme/globalStyles';
import GenericIcon from '../../../../foundation/components/icon/GenericIcon';
import CustomText from '../../../../foundation/components/text/CustomText';
import SortableList from '../../../../foundation/sortedLists/components/list/SortableList';
import Card from '../../../../foundation/components/card/Card';
import { Color } from '../../../../foundation/theme/colors';
import CollapseControl from '../../../../foundation/sortedLists/components/collapseControl/CollapseControl';
import { EventChipProps } from '../../../../foundation/planners/components/EventChip';

interface BirthdayChecklistProps {
        birthdays: EventChipProps[];
};

const BirthdayChecklist = ({birthdays}: BirthdayChecklistProps) => {
    const [collapsed, setCollapsed] = useState(false);
    const timestamp = getTodayTimestamp();

    function toggleCollapsed() {
        if (allBirthdaysContacted)
            setCollapsed(curr => !curr)
    };

    // Stores the current planner and all handler functions to update it
    const BirthdayList = useSortedList<ListItem, ListItem[]>(
        timestamp,
        BIRTHDAY_CHECKLIST_ID,
        (currentList) => buildBirthdayChecklist(currentList, birthdays.map(bday => bday.label)),
    );

    const allBirthdaysContacted = !BirthdayList.items.some(item => item.status === ItemStatus.STATIC);

    return BirthdayList.items.length > 0 &&
        <View style={styles.card}>
            <Card header={
                <View style={globalStyles.verticallyCentered}>
                    <GenericIcon
                        type='birthday'
                        size={16}
                        color={birthdays[0]?.color}
                    />
                    <CustomText type='header'>
                        Today's Birthdays
                    </CustomText>
                </View>
            }
            >

                {/* Collapse Control */}
                <CollapseControl
                    itemCount={BirthdayList.items.length}
                    itemName='birthday'
                    onClick={toggleCollapsed}
                    display={allBirthdaysContacted}
                    collapsed={collapsed}
                />

                {/* Birthday List */}
                <SortableList<ListItem, never, never>
                    listId={BIRTHDAY_CHECKLIST_ID}
                    staticList
                    hideList={collapsed}
                    items={BirthdayList.items}
                    getRightIconConfig={item => ({
                        icon: {
                            type: isItemDeleting(item) ? 'messageFilled' : 'message',
                            size: 16,
                            color: isItemDeleting(item) ? Color.DIM : Color.BLUE
                        },
                        onClick: () => {
                            const newContactedStatus = !isItemDeleting(item);
                            if (newContactedStatus) {
                                // TODO: open message to person
                                BirthdayList.persistItemToStorage({ ...item, status: ItemStatus.DELETE });
                            } else {
                                BirthdayList.persistItemToStorage({ ...item, status: ItemStatus.STATIC });
                            }
                        }
                    })}
                    onDeleteItem={BirthdayList.deleteItemFromStorage}
                    onContentClick={() => { }}
                    getTextfieldKey={(item) => `${item.id}-${item.sortId}`}
                    onSaveTextfield={() => { }}
                    onDragEnd={BirthdayList.persistItemToStorage}
                />
            </Card>
        </View>
};

const styles = StyleSheet.create({
    card: {
        paddingHorizontal: 16,
        marginTop: 8,
        width: '100%'
    }
});

export default BirthdayChecklist;
