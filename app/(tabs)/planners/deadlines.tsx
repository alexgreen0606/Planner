import SortableList from '@/components/sortedList';
import Toolbar, { ToolbarProps } from '@/components/sortedList/ListItemToolbar';
import CustomText from '@/components/text/CustomText';
import DateValue from '@/components/text/DateValue';
import { DEADLINE_LIST_KEY } from '@/constants/storageIds';
import useSortedList from '@/hooks/useSortedList';
import { useTextfieldData } from '@/hooks/useTextfieldData';
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
import { View } from 'react-native';
import DatePicker from 'react-native-date-picker';

const Deadlines = () => {
    const { currentTextfield, setCurrentTextfield } = useTextfieldData<IDeadline>();
    const { setUpperContentHeight } = useScrollContainer();

    const [dateSelectOpen, setDateSelectOpen] = useState(false);

    const todayMidnight = datestampToMidnightDate(getTodayDatestamp());

    useEffect(() => {
        setUpperContentHeight(0);
    }, [])

    // ------------- Utility Functions -------------

    function initializeDeadline(item: IListItem) {
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

    const DeadlineItems = useSortedList<IDeadline, IDeadline[]>({
        storageId: DEADLINE_LIST_KEY,
        storageKey: DEADLINE_LIST_KEY,
        getItemsFromStorageObject: getDeadlines,
        storageConfig: {
            create: async (deadline) => {
                const newId = await saveDeadline(deadline, true);
                await DeadlineItems.refetchItems();
                await loadCalendarData();

                // Return the newly generated ID. Prevents duplicates of the same deadline in the list.
                return newId;
            },
            update: async (deadline) => {
                await saveDeadline(deadline, false);
                await DeadlineItems.refetchItems();
                await loadCalendarData();
            },
            delete: async (deadlines) => {
                await deleteDeadlines(deadlines);
                await DeadlineItems.refetchItems();
                await loadCalendarData();
            }
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
                title={currentTextfield?.value}
                theme='dark'
                minimumDate={datestampToMidnightDate(getTodayDatestamp())}
                open={dateSelectOpen && Boolean(currentTextfield)}
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
                    updatedDeadline.sortId = generateSortIdByTime(updatedDeadline, DeadlineItems.items);
                    setCurrentTextfield({
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