import React, { useState } from 'react';
import { isItemDeleting } from '../../foundation/sortedLists/sortedListUtils';
import useSortedList from '../../foundation/sortedLists/hooks/useSortedList';
import { buildBirthdayChecklist } from './storage/birthdayStorage';
import { StyleSheet, View } from 'react-native';
import globalStyles from '../../foundation/theme/globalStyles';
import CustomText from '../../foundation/components/text/CustomText';
import SortableList from '../../foundation/sortedLists/components/list/SortableList';
import { Palette } from '../../foundation/theme/colors';
import { EventChipProps } from '../../foundation/calendarEvents/components/EventChip';
import { BIRTHDAY_CHECKLIST_STORAGE_ID } from './types';
import { getTodayDatestamp } from '../../foundation/calendarEvents/timestampUtils';
import Card from '../../foundation/components/Card';
import GenericIcon from '../../foundation/components/GenericIcon';
import CollapseControl from '../../foundation/sortedLists/components/CollapseControl';
import { ItemStatus, ListItem } from '../../foundation/sortedLists/types';

interface BirthdayChecklistProps {
    birthdays: EventChipProps[];
};

const BirthdayCard = ({ birthdays }: BirthdayChecklistProps) => {
    const [collapsed, setCollapsed] = useState(false);
    const timestamp = getTodayDatestamp();

    function toggleCollapsed() {
        if (allBirthdaysContacted)
            setCollapsed(curr => !curr)
    };

    // Stores the current planner and all handler functions to update it
    const BirthdayList = useSortedList<ListItem, ListItem[]>(
        timestamp,
        BIRTHDAY_CHECKLIST_STORAGE_ID,
        (currentList) => buildBirthdayChecklist(currentList, birthdays.map(bday => bday.label)),
    );

    const allBirthdaysContacted = !BirthdayList.items.some(item => item.status === ItemStatus.STATIC);

    return BirthdayList.items.length > 0 &&
        <View style={styles.card}>
            <Card header={
                <View style={globalStyles.verticallyCentered}>
                    <GenericIcon
                        type='birthday'
                        size='l'
                        color={birthdays[0]?.color}
                    />
                    <CustomText type='header'>
                        Birthdays
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
                    listId={BIRTHDAY_CHECKLIST_STORAGE_ID}
                    staticList
                    hideList={collapsed}
                    items={BirthdayList.items}
                    getRightIconConfig={item => ({
                        icon: {
                            type: isItemDeleting(item) ? 'messageFilled' : 'message',
                            color: isItemDeleting(item) ? Palette.DIM : Palette.BLUE
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

export default BirthdayCard;
