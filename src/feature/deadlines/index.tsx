import React, { useState } from 'react';
import { View } from 'react-native';
import { useSortableList } from '../../foundation/sortedLists/services/SortableListProvider';
import { daysBetweenToday, datestampToMidnightDate, getTodayDatestamp, generateSortIdByTime } from '../../foundation/calendarEvents/timestampUtils';
import globalStyles from '../../foundation/theme/globalStyles';
import SortableList from '../../foundation/sortedLists/components/list/SortableList';
import { generateSortId, isItemTextfield } from '../../foundation/sortedLists/utils';
import useSortedList from '../../foundation/sortedLists/hooks/useSortedList';
import DateValue from '../../foundation/calendarEvents/components/values/DateValue';
import CustomText from '../../foundation/components/text/CustomText';
import DatePicker from 'react-native-date-picker';
import { deleteDeadlines, getDeadlines, saveDeadline } from './deadlineUtils';
import { DEADLINE_LIST_KEY } from './constants';
import { Deadline } from '../../foundation/calendarEvents/types';
import GenericIcon from '../../foundation/components/GenericIcon';
import { ListItem, ModifyItemConfig } from '../../foundation/sortedLists/types';
import Toolbar, { ToolbarProps } from '../../foundation/sortedLists/components/ListItemToolbar';

const Deadlines = () => {
    const { currentTextfield, setCurrentTextfield } = useSortableList();
    const [dateSelectOpen, setDateSelectOpen] = useState(false);

    const todayMidnight = datestampToMidnightDate(getTodayDatestamp());

    function initializedeadline(item: ListItem) {
        const newSortId = generateSortId(-1, DeadlineItems.items);
        return {
            ...item,
            sortId: newSortId,
            startTime: todayMidnight
        }
    };

    async function toggleDateSelector(deadline: Deadline) {
        if (!isItemTextfield(deadline)) {
            await DeadlineItems.toggleItemEdit(deadline);
        }
        setDateSelectOpen(curr => !curr);
    };

    function generateToolbar(
        deadline: Deadline,
    ): ModifyItemConfig<Deadline, ToolbarProps<Deadline>> {
        return {
            component: Toolbar,
            props: {
                open: !dateSelectOpen && isItemTextfield(deadline),
                iconSets: [
                    [{
                        type: 'trash',
                        onClick: () => { DeadlineItems.toggleItemDelete(deadline) }
                    }],
                    [{
                        type: 'clock',
                        onClick: () => { toggleDateSelector(deadline) },
                        customIcon:
                            <View style={{ transform: 'scale(1.1)' }}>
                                <DateValue timestamp={deadline.startTime.toISOString()} />
                            </View>
                    }]],
                item: deadline,
                hideKeyboard: dateSelectOpen
            },
        }
    }

    const DeadlineItems = useSortedList<Deadline, Deadline[]>({
        storageId: DEADLINE_LIST_KEY,
        storageKey: DEADLINE_LIST_KEY,
        getItemsFromStorageObject: getDeadlines,
        storageConfig: {
            create: async (deadline) => {
                const newId = await saveDeadline(deadline, true);
                DeadlineItems.refetchItems();
                return newId;
            },
            update: async (deadline) => {
                await saveDeadline(deadline, false);
                DeadlineItems.refetchItems();
            },
            delete: async (deadlines) => {
                await deleteDeadlines(deadlines);
                DeadlineItems.refetchItems();
            }
        }
    });

    return (
        <View style={globalStyles.blackFilledSpace}>

            {/* deadline List */}
            <SortableList<Deadline, ToolbarProps<Deadline>, never>
                listId={DEADLINE_LIST_KEY}
                fillSpace
                disableDrag
                items={DeadlineItems.items}
                initializeItem={initializedeadline}
                onDeleteItem={DeadlineItems.deleteSingleItemFromStorage}
                onContentClick={DeadlineItems.toggleItemEdit}
                getTextfieldKey={(item) => `${item.id}-${item.sortId}`}
                onSaveTextfield={DeadlineItems.persistItemToStorage}
                getToolbar={(deadline) => generateToolbar(deadline)}
                emptyLabelConfig={{
                    label: 'No deadlines',
                    style: { flex: 1 }
                }}
                getLeftIconConfig={(item) => ({
                    onClick: toggleDateSelector,
                    hideIcon: isItemTextfield(item),
                    customIcon: <DateValue timestamp={item.startTime.toISOString()} />
                })}
                getRightIconConfig={(deadline) => ({
                    customIcon:
                        <View style={{ width: 55 }}>
                            <CustomText adjustsFontSizeToFit numberOfLines={1} style={{ width: 55 }} type='soft'>
                                {daysBetweenToday(deadline.startTime)} days
                            </CustomText>
                        </View>
                })}
            />

            {/* Date Picker Modal */}
            <DatePicker
                modal
                mode='date'
                title={`"${currentTextfield?.value}" deadline`}
                theme='dark'
                minimumDate={datestampToMidnightDate(getTodayDatestamp())}
                open={dateSelectOpen && currentTextfield}
                date={currentTextfield?.startTime ?? todayMidnight}
                timeZoneOffsetInMinutes={new Date().getTimezoneOffset()}
                onConfirm={(date) => {
                    if (!currentTextfield) return;
                    const updatedDeadline = { ...currentTextfield, startTime: date.toISOString() };
                    const updatedList = [...DeadlineItems.items];
                    const itemCurrentIndex = updatedList.findIndex(listItem => listItem.id === currentTextfield.id);
                    if (itemCurrentIndex !== -1) {
                        updatedList[itemCurrentIndex] = updatedDeadline;
                    } else {
                        updatedList.push(updatedDeadline);
                    }
                    updatedDeadline.sortId = generateSortIdByTime(updatedDeadline, updatedList);
                    setCurrentTextfield({ ...updatedDeadline, startTime: date });
                    toggleDateSelector(currentTextfield);
                }}
                onCancel={() => toggleDateSelector(currentTextfield)}
            />
        </View>
    );
};

export default Deadlines;