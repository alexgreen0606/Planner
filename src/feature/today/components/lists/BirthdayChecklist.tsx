import React from 'react';
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
import Colors from '../../../../foundation/theme/colors';
import Card from '../../../../foundation/components/card/Card';

const BirthdayChecklist = () => {
    const timestamp = getTodayTimestamp();

    // Stores the current planner and all handler functions to update it
    const BirthdayList = useSortedList<ListItem, ListItem[]>(
        timestamp,
        BIRTHDAY_CHECKLIST_ID,
        (currentList) => buildBirthdayChecklist(currentList),
    );

    return BirthdayList.items.length > 0 &&
        <Card header={
            <View style={globalStyles.verticallyCentered}>
                <GenericIcon
                    type='birthday'
                    size={16}
                    color={Colors.GREEN}
                />
                <CustomText type='header'>
                    Birthdays
                </CustomText>
            </View>
        } style={styles.card}
        >
            <SortableList<ListItem, never, never>
                listId={timestamp}
                items={BirthdayList.items}
                getRightIconConfig={item => ({
                    icon: {
                        type: isItemDeleting(item) ? 'messageFilled' : 'message',
                        size: 16,
                        color: isItemDeleting(item) ? Colors.GREY : Colors.BLUE
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
};

const styles = StyleSheet.create({
    card: {
        width: '80%'
    }
});

export default BirthdayChecklist;
