import React, { useState } from 'react';
import { Deadline, DEADLINE_LIST_KEY, deleteDeadline, getDeadlines, saveDeadline } from '../deadlineUtils';
import { daysBetweenToday, getTodayGenericTimestamp, genericTimestampToMidnightDate } from '../../../foundation/calendar/dateUtils';
import { isItemTextfield, ListItem } from '../../../foundation/sortedLists/sortedListUtils';
import useSortedList from '../../../foundation/sortedLists/hooks/useSortedList';
import { StyleSheet, View } from 'react-native';
import globalStyles from '../../../foundation/theme/globalStyles';
import GenericIcon from '../../../foundation/ui/icon/GenericIcon';
import CustomText from '../../../foundation/ui/text/CustomText';
import SortableList from '../../../foundation/sortedLists/components/list/SortableList';
import Card from '../../../foundation/ui/card/Card';
import { Color } from '../../../foundation/theme/colors';
import CollapseControl from '../../../foundation/sortedLists/components/collapseControl/CollapseControl';
import DateValue from '../../../foundation/calendar/components/DateValue';
import { useSortableListContext } from '../../../foundation/sortedLists/services/SortableListProvider';
import DatePicker from 'react-native-date-picker'

const DeadlineList = () => {
    const { currentTextfield, setCurrentTextfield } = useSortableListContext();
    const [collapsed, setCollapsed] = useState(false);
    const [dateSelectOpen, setDateSelectOpen] = useState(false);

    const todayMidnight = genericTimestampToMidnightDate(getTodayGenericTimestamp());

    function initializeDeadline(item: ListItem) {
        return {
            ...item,
            date: todayMidnight
        }
    };
    function toggleCollapsed() { setCollapsed(curr => !curr) };
    async function toggleDateSelector(deadline: Deadline) {
        if (!isItemTextfield(deadline))
            await DeadlineItems.toggleItemEdit(deadline);
        setDateSelectOpen(curr => !curr);
    };

    const DeadlineItems = useSortedList<Deadline, Deadline[]>(
        DEADLINE_LIST_KEY,
        DEADLINE_LIST_KEY,
        () => getDeadlines(),
        (list) => list,
        {
            create: (deadline) => {
                saveDeadline(deadline, true);
                DeadlineItems.refetchItems();
            },
            update: (deadline) => {
                saveDeadline(deadline, false);
                DeadlineItems.refetchItems();
            },
            delete: (deadline) => {
                deleteDeadline(deadline);
                DeadlineItems.refetchItems();
            }
        }
    );

    return (
        <View style={styles.card}>
            <Card header={
                <View style={globalStyles.verticallyCentered}>
                    <GenericIcon
                        type='alert'
                        size={16}
                        color={Color.RED}
                    />
                    <CustomText type='header'>
                        Upcoming Deadlines
                    </CustomText>
                </View>
            }
            >

                {/* Collapse Control */}
                <CollapseControl
                    itemCount={DeadlineItems.items.length}
                    itemName='deadline'
                    onClick={toggleCollapsed}
                    display={!!DeadlineItems.items.length}
                    collapsed={collapsed}
                />

                {/* Deadline List */}
                <SortableList<Deadline, never, never>
                    listId={DEADLINE_LIST_KEY}
                    hideList={collapsed}
                    items={DeadlineItems.items}
                    getRightIconConfig={(item) => ({
                        onClick: toggleDateSelector,
                        customIcon: <DateValue timestamp={item.date.toISOString()} />
                    })}
                    initializeItem={initializeDeadline}
                    onDeleteItem={DeadlineItems.deleteItemFromStorage}
                    onContentClick={DeadlineItems.toggleItemEdit}
                    getTextfieldKey={(item) => `${item.id}-${item.sortId}`}
                    onSaveTextfield={DeadlineItems.persistItemToStorage}
                    onDragEnd={DeadlineItems.persistItemToStorage} // todo no dragging
                    emptyLabelConfig={{
                        label: 'No Upcoming Deadlines',
                        style: { height: 40, paddingBottom: 8 }
                    }}
                    getLeftIconConfig={(deadline) => ({
                        customIcon:
                            <CustomText type='soft'>
                                {daysBetweenToday(deadline.date)} days
                            </CustomText>
                    })}
                />
                {/* Date Picker Modal */}
                <DatePicker
                    modal
                    mode='date'
                    title={`"${currentTextfield?.value}" Deadline`}
                    theme='dark'
                    minimumDate={genericTimestampToMidnightDate(getTodayGenericTimestamp())}
                    open={dateSelectOpen && currentTextfield}
                    date={currentTextfield?.date ?? todayMidnight}
                    timeZoneOffsetInMinutes={new Date().getTimezoneOffset()}
                    onConfirm={(date) => {
                        setCurrentTextfield({ ...currentTextfield, date });
                        toggleDateSelector(currentTextfield);
                    }}
                    onCancel={() => toggleDateSelector(currentTextfield)}
                />
            </Card>
        </View>
    )
};

const styles = StyleSheet.create({
    card: {
        paddingHorizontal: 16,
        marginBottom: 8,
        width: '100%'
    }
});

export default DeadlineList;
