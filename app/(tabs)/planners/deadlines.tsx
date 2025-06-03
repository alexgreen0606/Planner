import SortableList from '@/components/sortedList';
import Toolbar, { ToolbarProps } from '@/components/sortedList/ListItemToolbar';
import CustomText from '@/components/text/CustomText';
import DateValue from '@/components/text/DateValue';
import { DEADLINE_LIST_KEY } from '@/constants/storageIds';
import useSortedList from '@/hooks/useSortedList';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { useScrollContainer } from '@/services/ScrollContainer';
import { ModifyItemConfig } from '@/types/listItems/core/rowConfigTypes';
import { IListItem } from '@/types/listItems/core/TListItem';
import { IDeadline } from '@/types/listItems/IDeadline';
import { loadCalendarData } from '@/utils/calendarUtils';
import { datestampToMidnightDate, daysBetweenToday, getTodayDatestamp } from '@/utils/dateUtils';
import { deleteDeadlines, getDeadlines, saveDeadline } from '@/utils/deadlineUtils';
import { generateSortId, isItemTextfield } from '@/utils/listUtils';
import { generateSortIdByTime } from '@/utils/plannerUtils';
import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import DatePicker from 'react-native-date-picker';

const Deadlines = () => {
    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<IDeadline>();
    const { setUpperContentHeight } = useScrollContainer();

    const [dateSelectOpen, setDateSelectOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    const todayMidnight = datestampToMidnightDate(getTodayDatestamp());

    useEffect(() => {
        setUpperContentHeight(0);
    }, [])

    // ------------- Utility Functions -------------

    function initializeDeadline(item: IListItem) {
        return {
            ...item,
            // Place textfield above the first deadline
            sortId: 0.5,
            startTime: DateTime.fromJSDate(todayMidnight).toISO()!
        }
    };

    function toggleDateSelector() {
        setDateSelectOpen(curr => !curr);
    };

    function generateToolbar(
        deadline: IDeadline,
    ): ModifyItemConfig<IDeadline, ToolbarProps<IDeadline>> {
        return {
            component: Toolbar,
            props: {
                open: !dateSelectOpen && isItemTextfield(deadline),
                iconSets: [
                    [{
                        type: 'trash',
                        onClick: () => {
                            setIsDeleteAlertOpen(true);
                            Alert.alert(
                                `Delete "${deadline.value}"?`,
                                'The event in your calendar will also be deleted.',
                                [
                                    {
                                        text: 'Cancel',
                                        style: 'cancel',
                                        onPress: () => {
                                            setIsDeleteAlertOpen(false);
                                        }
                                    },
                                    {
                                        text: 'Delete',
                                        style: 'destructive',
                                        onPress: async () => {
                                            setTextfieldItem(undefined);
                                            await DeadlineItems.deleteSingleItemFromStorage(deadline);
                                            await DeadlineItems.refetchItems();
                                            setIsDeleteAlertOpen(false);
                                        }
                                    }
                                ]
                            );
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

    const DeadlineItems = useSortedList<IDeadline, IDeadline[]>({
        storageId: DEADLINE_LIST_KEY,
        storageKey: DEADLINE_LIST_KEY,
        getItemsFromStorageObject: getDeadlines,
        storageConfig: {
            create: async (deadline) => {
                // Return the newly generated ID. Keeps the texfield from flickering shut.
                return await saveDeadline(deadline, true);
            },
            update: async (deadline) => {
                await saveDeadline(deadline);
            },
            delete: async (deadlines) => {
                await deleteDeadlines(deadlines);
                await DeadlineItems.refetchItems();

                // Lazy load calendar data for planners.
                loadCalendarData();
            }
        },
        handleTextfieldSave: async () => {
            await DeadlineItems.refetchItems();

            // Lazy load calendar data for planners.
            loadCalendarData();
        },
        initializeListItem: initializeDeadline,
        reloadOnOverscroll: true
    });

    return (
        <View className='flex-1'>

            {/* Deadline List */}
            <SortableList<IDeadline, ToolbarProps<IDeadline>, never>
                listId={DEADLINE_LIST_KEY}
                fillSpace
                items={DeadlineItems.items}
                hideKeyboard={isDeleteAlertOpen}
                onDragEnd={() => { }} // TODO: refresh list?
                onDeleteItem={DeadlineItems.deleteSingleItemFromStorage}
                onContentClick={DeadlineItems.toggleItemEdit}
                getTextfieldKey={(item) => `${item.id}-${item.sortId}`}
                saveTextfieldAndCreateNew={DeadlineItems.saveTextfieldAndCreateNew}
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
                title={textfieldItem?.value}
                theme='dark'
                minimumDate={datestampToMidnightDate(getTodayDatestamp())}
                open={dateSelectOpen && Boolean(textfieldItem)}
                date={
                    textfieldItem?.startTime
                        ? DateTime.fromISO(textfieldItem.startTime).toJSDate()
                        : todayMidnight
                }
                onConfirm={(date) => {
                    if (!textfieldItem) return;

                    const selected = DateTime.fromJSDate(date);
                    const updatedDeadline = {
                        ...textfieldItem,
                        startTime: selected.toISO(),
                    };
                    updatedDeadline.sortId = generateSortIdByTime(updatedDeadline, DeadlineItems.items);
                    setTextfieldItem({
                        ...updatedDeadline,
                        startTime: selected.toISO()!
                    });

                    toggleDateSelector();
                }}
                onCancel={toggleDateSelector}
            />

        </View>
    );
};

export default Deadlines;