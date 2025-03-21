import React, { useState } from 'react';
import { isItemDeleting } from '../../foundation/sortedLists/utils';
import useSortedList from '../../foundation/sortedLists/hooks/useSortedList';
import { buildBirthdayChecklist } from './storage/birthdayStorage';
import { PlatformColor, StyleSheet, View } from 'react-native';
import globalStyles from '../../foundation/theme/globalStyles';
import CustomText from '../../foundation/components/text/CustomText';
import SortableList from '../../foundation/sortedLists/components/list/SortableList';
import { EventChipProps } from '../../foundation/calendarEvents/components/EventChip';
import { BIRTHDAY_CHECKLIST_STORAGE_ID } from './types';
import { getTodayDatestamp } from '../../foundation/calendarEvents/timestampUtils';
import Card from '../../foundation/components/Card';
import GenericIcon from '../../foundation/components/GenericIcon';
import CollapseControl from '../../foundation/sortedLists/components/CollapseControl';
import { ItemStatus, ListItem } from '../../foundation/sortedLists/types';
import { extractNameFromBirthdayText, openBirthdayMessage } from './utils';

interface BirthdayChecklistProps {
    birthdays: EventChipProps[];
};

const BirthdayCard = ({ birthdays }: BirthdayChecklistProps) => {
    const [collapsed, setCollapsed] = useState(false);
    const todayDatestamp = getTodayDatestamp();
    const BirthdayList = useSortedList<ListItem, ListItem[]>(
        todayDatestamp,
        BIRTHDAY_CHECKLIST_STORAGE_ID,
        (currentList) => buildBirthdayChecklist(currentList, birthdays.map(bday => bday.label), todayDatestamp),
    );

    function toggleCollapsed() {
        if (allBirthdaysContacted)
            setCollapsed(curr => !curr)
    };

    const allBirthdaysContacted = !BirthdayList.items.some(item => item.status === ItemStatus.STATIC);

    return BirthdayList.items.length > 0 &&
        <View style={styles.card}>
            <Card header={
                <View style={globalStyles.verticallyCentered}>
                    <GenericIcon
                        type='birthday'
                        size='l'
                        platformColor={birthdays[0]?.color}
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
                    onDeleteItem={BirthdayList.deleteItemFromStorage}
                    onContentClick={() => { }}
                    getTextfieldKey={(item) => `${item.id}-${item.sortId}`}
                    onSaveTextfield={() => { }}
                    onDragEnd={BirthdayList.persistItemToStorage}
                    getRightIconConfig={item => ({
                        icon: {
                            type: isItemDeleting(item) ? 'messageFilled' : 'message',
                            platformColor: isItemDeleting(item) ? 'secondaryLabel' : 'systemTeal',
                            hideRipple: true
                        },
                        onClick: async () => {
                            const newContactedStatus = !isItemDeleting(item);
                            if (newContactedStatus) {
                                const personName = extractNameFromBirthdayText(item.value);
                                if (personName) {
                                    await openBirthdayMessage(personName);
                                }
                                BirthdayList.persistItemToStorage({ ...item, status: ItemStatus.DELETE });
                            } else {
                                BirthdayList.persistItemToStorage({ ...item, status: ItemStatus.STATIC });
                            }
                        }
                    })}
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
