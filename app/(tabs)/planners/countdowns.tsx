import SortableList from '@/components/sortedList';
import { ToolbarProps } from '@/components/sortedList/ListItemToolbar';
import CustomText from '@/components/text/CustomText';
import DateValue from '@/components/text/DateValue';
import { StorageKey } from '@/constants/storage';
import useSortedList from '@/hooks/useSortedList';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { IListItem } from '@/types/listItems/core/TListItem';
import { ICountdown } from '@/types/listItems/ICountdown';
import { loadCalendarData } from '@/utils/calendarUtils';
import { deleteCountdowns, getCountdowns, saveCountdown } from '@/utils/countdownUtils';
import { datestampToMidnightDate, daysBetweenToday, getTodayDatestamp } from '@/utils/dateUtils';
import { isItemTextfield } from '@/utils/listUtils';
import { generateSortIdByTime } from '@/utils/plannerUtils';
import { DateTime } from 'luxon';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import DatePicker from 'react-native-date-picker';

const Countdowns = () => {
    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<ICountdown>();

    const closeTextfieldOnDateSelectorClose = useRef(false);

    const [dateSelectOpen, setDateSelectOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    const todayMidnight = datestampToMidnightDate(getTodayDatestamp());

    // ------------- Utility Functions -------------

    function initializeCountdown(item: IListItem) {
        return {
            ...item,
            // Place textfield above the first countdown
            sortId: 0.5,
            startTime: DateTime.fromJSDate(todayMidnight).toISO()!
        }
    }

    function toggleDateSelector() {
        setDateSelectOpen(curr => !curr);
        if (closeTextfieldOnDateSelectorClose.current) {
            setTextfieldItem(null);
            closeTextfieldOnDateSelectorClose.current = false;
        }
    }

    function generateToolbar(countdown: ICountdown): ToolbarProps<ICountdown> {
        return {
            open: !dateSelectOpen && isItemTextfield(countdown),
            iconSets: [
                [{
                    type: 'trash',
                    onClick: () => {
                        setIsDeleteAlertOpen(true);
                        Alert.alert(
                            `Delete "${countdown.value}"?`,
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
                                        await CountdownItems.deleteSingleItemFromStorage(countdown);
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
            item: countdown
        }
    }

    const CountdownItems = useSortedList<ICountdown, ICountdown[]>({
        storageId: StorageKey.COUNTDOWN_LIST_KEY,
        storageKey: StorageKey.COUNTDOWN_LIST_KEY,
        getItemsFromStorageObject: getCountdowns,
        storageConfig: {
            createItem: async (countdown) => {
                await saveCountdown(countdown, true);
            },
            updateItem: saveCountdown,
            deleteItems: deleteCountdowns
        },
        handleListChange: async () => {
            await CountdownItems.refetchItems();

            // Lazy load calendar data for planners.
            loadCalendarData();
        },
        initializeListItem: initializeCountdown,
        reloadOnOverscroll: true
    });

    useEffect(() => {
        return () => setTextfieldItem(null); // TODO: save the item instead
    }, []);

    return (
        <View className='flex-1'>

            {/* Countdown List */}
            <SortableList<ICountdown>
                listId={StorageKey.COUNTDOWN_LIST_KEY}
                fillSpace
                disableDrag
                items={CountdownItems.items}
                hideKeyboard={isDeleteAlertOpen || dateSelectOpen}
                onDeleteItem={CountdownItems.deleteSingleItemFromStorage}
                onContentClick={CountdownItems.toggleItemEdit}
                getTextfieldKey={(item) => `${item.id}-${item.sortId}`}
                saveTextfieldAndCreateNew={CountdownItems.saveTextfieldAndCreateNew}
                getToolbarProps={generateToolbar}
                emptyLabelConfig={{
                    label: 'No countdowns',
                    className: 'flex-1'
                }}
                getLeftIconConfig={(item) => ({
                    onClick: async () => {
                        closeTextfieldOnDateSelectorClose.current = true;
                        // TODO: need to save the item directly on close, not just set the textfield
                        await CountdownItems.toggleItemEdit(item);
                        setDateSelectOpen(true);
                    },
                    customIcon: <DateValue concise isoTimestamp={item.startTime} />
                })}
                getRightIconConfig={(countdown) => ({
                    customIcon:
                        <View className="[width:55px] items-end">
                            <CustomText adjustsFontSizeToFit numberOfLines={1} type='soft'>
                                {daysBetweenToday(countdown.startTime)} days
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
                    const updatedCountdown = {
                        ...textfieldItem,
                        startTime: selected.toISO(),
                    };
                    updatedCountdown.sortId = generateSortIdByTime(updatedCountdown, CountdownItems.items);
                    setTextfieldItem({
                        ...updatedCountdown,
                        startTime: selected.toISO()!
                    });

                    toggleDateSelector();
                }}
                onCancel={toggleDateSelector}
            />

        </View>
    );
};

export default Countdowns;