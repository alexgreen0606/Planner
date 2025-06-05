import SortableList from '@/components/sortedList';
import Toolbar, { ToolbarProps } from '@/components/sortedList/ListItemToolbar';
import CustomText from '@/components/text/CustomText';
import DateValue from '@/components/text/DateValue';
import { StorageKey } from '@/constants/storage';
import useSortedList from '@/hooks/useSortedList';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { useScrollContainer } from '@/services/ScrollContainer';
import { ModifyItemConfig } from '@/types/listItems/core/rowConfigTypes';
import { IListItem } from '@/types/listItems/core/TListItem';
import { IDeadline } from '@/types/listItems/IDeadline';
import { loadCalendarData } from '@/utils/calendarUtils';
import { datestampToMidnightDate, daysBetweenToday, getTodayDatestamp } from '@/utils/dateUtils';
import { deleteDeadlines, getDeadlines, saveDeadline } from '@/utils/deadlineUtils';
import { isItemTextfield } from '@/utils/listUtils';
import { generateSortIdByTime } from '@/utils/plannerUtils';
import { DateTime } from 'luxon';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import DatePicker from 'react-native-date-picker';

const Deadlines = () => {
    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<IDeadline>();
    const { setUpperContentHeight } = useScrollContainer();

    const closeTextfieldOnDateSelectorClose = useRef(false);

    const [dateSelectOpen, setDateSelectOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    const todayMidnight = datestampToMidnightDate(getTodayDatestamp());

    useEffect(() => {
        setUpperContentHeight(0);

        return () => setTextfieldItem(null); // TODO: save the item instead
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
        if (closeTextfieldOnDateSelectorClose.current) {
            setTextfieldItem(null);
            closeTextfieldOnDateSelectorClose.current = false;
        }
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
                                            await DeadlineItems.deleteSingleItemFromStorage(deadline);
                                            setTextfieldItem(null);
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
        storageId: StorageKey.DEADLINE_LIST_KEY,
        storageKey: StorageKey.DEADLINE_LIST_KEY,
        getItemsFromStorageObject: getDeadlines,
        storageConfig: {
            createItem: async (deadline) => {
                await saveDeadline(deadline, true);
            },
            updateItem: saveDeadline,
            deleteItems: deleteDeadlines
        },
        handleListChange: async () => {
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
                listId={StorageKey.DEADLINE_LIST_KEY}
                fillSpace
                items={DeadlineItems.items}
                hideKeyboard={isDeleteAlertOpen || dateSelectOpen}
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
                    onClick: async () => {
                        closeTextfieldOnDateSelectorClose.current = true;
                        await DeadlineItems.toggleItemEdit(item);
                        setDateSelectOpen(true);
                    },
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