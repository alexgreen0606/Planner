import CustomText from '@/components/text/CustomText';
import DateValue from '@/components/text/DateValue';
import { DEADLINE_LIST_KEY } from '@/feature/deadlines/constants';
import { deleteDeadlines, getDeadlines, saveDeadline } from '@/feature/deadlines/deadlineUtils';
import { Deadline } from '@/feature/deadlines/types';
import SortableList from '@/feature/sortedList';
import Toolbar, { ToolbarProps } from '@/feature/sortedList/components/ListItemToolbar';
import useSortedList from '@/feature/sortedList/hooks/useSortedList';
import { useScrollContainer } from '@/feature/sortedList/services/ScrollContainerProvider';
import { ListItem, ModifyItemConfig } from '@/feature/sortedList/types';
import { generateSortId, isItemTextfield } from '@/feature/sortedList/utils';
import { datestampToMidnightDate, daysBetweenToday, generateSortIdByTime, getTodayDatestamp } from '@/utils/calendarUtils/timestampUtils';
import { DateTime } from 'luxon';
import React, { useState } from 'react';
import { View } from 'react-native';
import DatePicker from 'react-native-date-picker';

const Deadlines = () => {

    const todayMidnight = datestampToMidnightDate(getTodayDatestamp());

    const { currentTextfield, setCurrentTextfield } = useScrollContainer();

    const [dateSelectOpen, setDateSelectOpen] = useState(false);

    // ------------- Utility Functions -------------

    function initializeDeadline(item: ListItem) {
        const newSortId = generateSortId(-1, DeadlineItems.items);
        return {
            ...item,
            sortId: newSortId,
            startTime: DateTime.fromJSDate(todayMidnight).toISO()!
        }
    };

    function toggleDateSelector() {
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
                        onClick: () => {
                            DeadlineItems.toggleItemDelete(deadline);
                        }
                    }],
                    [{
                        type: 'planners',
                        onClick: toggleDateSelector
                    }]],
                item: deadline
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
                await DeadlineItems.refetchItems();

                // Return the newly generated ID. Prevents duplicates of the same deadline in the list.
                return newId;
            },
            update: async (deadline) => {
                await saveDeadline(deadline, false);
                await DeadlineItems.refetchItems();
            },
            delete: async (deadlines) => {
                await deleteDeadlines(deadlines);
                await DeadlineItems.refetchItems();
            }
        },
        reloadOnOverscroll: true
    });

    return (
        <View className='flex-1'>

            {/* Deadline List */}
            <SortableList<Deadline, ToolbarProps<Deadline>, never>
                listId={DEADLINE_LIST_KEY}
                fillSpace
                disableDrag
                items={DeadlineItems.items}
                initializeItem={initializeDeadline}
                onDeleteItem={DeadlineItems.deleteSingleItemFromStorage}
                onContentClick={DeadlineItems.toggleItemEdit}
                getTextfieldKey={(item) => `${item.id}-${item.sortId}`}
                onSaveTextfield={DeadlineItems.persistItemToStorage}
                getToolbar={generateToolbar}
                emptyLabelConfig={{
                    label: 'No deadlines',
                    className: 'flex-1'
                }}
                getLeftIconConfig={(item) => ({
                    onClick: DeadlineItems.toggleItemEdit,
                    customIcon: <DateValue concise isoTimestamp={item.startTime} />
                })}
                getRightIconConfig={(deadline) => ({
                    customIcon:
                        <View className="[width:55px] items-end">
                            <CustomText adjustsFontSizeToFit numberOfLines={1} type='soft'>
                                {daysBetweenToday(deadline.startTime)} days
                            </CustomText>
                        </View>
                })}
            />

            {/* Date Picker Modal */}
            <DatePicker
                modal
                mode='date'
                title={currentTextfield?.value}
                theme='dark'
                minimumDate={datestampToMidnightDate(getTodayDatestamp())}
                open={dateSelectOpen && currentTextfield}
                date={
                    currentTextfield?.startTime
                        ? DateTime.fromISO(currentTextfield.startTime).toJSDate()
                        : todayMidnight
                }
                onConfirm={(date) => {
                    if (!currentTextfield) return;

                    const selected = DateTime.fromJSDate(date);
                    const updatedDeadline = {
                        ...currentTextfield,
                        startTime: selected.toISO(),
                    };

                    const updatedList = [...DeadlineItems.items];
                    const itemCurrentIndex = updatedList.findIndex(
                        (listItem) => listItem.id === currentTextfield.id
                    );

                    if (itemCurrentIndex !== -1) {
                        updatedList[itemCurrentIndex] = updatedDeadline;
                    } else {
                        updatedList.push(updatedDeadline);
                    }

                    updatedDeadline.sortId = generateSortIdByTime(updatedDeadline, updatedList);
                    setCurrentTextfield({
                        ...updatedDeadline,
                        startTime: selected.toISO(),
                    });

                    toggleDateSelector();
                }}
                onCancel={toggleDateSelector}
            />

        </View>
    );
};

export default Deadlines;