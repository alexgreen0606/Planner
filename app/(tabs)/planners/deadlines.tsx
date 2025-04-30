import React, { useState } from 'react';
import { View } from 'react-native';
import { useScrollContainer } from '../../../src/foundation/sortedLists/services/ScrollContainerProvider';
import { datestampToMidnightDate, daysBetweenToday, generateSortIdByTime, getTodayDatestamp } from '../../../src/foundation/calendarEvents/timestampUtils';
import { ListItem, ModifyItemConfig } from '../../../src/foundation/sortedLists/types';
import { generateSortId, isItemTextfield } from '../../../src/foundation/sortedLists/utils';
import { Deadline } from '../../../src/feature/deadlines/types';
import Toolbar, { ToolbarProps } from '../../../src/foundation/sortedLists/components/ListItemToolbar';
import DateValue from '../../../src/foundation/calendarEvents/components/values/DateValue';
import useSortedList from '../../../src/foundation/sortedLists/hooks/useSortedList';
import { DEADLINE_LIST_KEY } from '../../../src/feature/deadlines/constants';
import { deleteDeadlines, getDeadlines, saveDeadline } from '../../../src/feature/deadlines/deadlineUtils';
import globalStyles from '../../../src/foundation/theme/globalStyles';
import SortableList from '../../../src/foundation/sortedLists/components/list/SortableList';
import CustomText from '../../../src/foundation/components/text/CustomText';
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