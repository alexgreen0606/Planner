import SortableList from '@/components/sortedList';
import { ToolbarProps } from '@/components/sortedList/ListItemToolbar';
import CustomText from '@/components/text/CustomText';
import DateValue from '@/components/text/DateValue';
import useSortedList from '@/hooks/useSortedList';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { useTodayDatestamp } from '@/hooks/useTodayDatestamp';
import { StorageKey } from '@/lib/constants/storage';
import { EListType } from '@/lib/enums/EListType';
import { IListItem } from '@/lib/types/listItems/core/TListItem';
import { ICountdown } from '@/lib/types/listItems/ICountdown';
import { deleteCountdown, getCountdowns, saveCountdown } from '@/utils/countdownUtils';
import { datestampToMidnightDate, daysBetweenToday, getDatestampThreeYearsFromToday, getTodayDatestamp } from '@/utils/dateUtils';
import { isItemTextfield } from '@/utils/listUtils';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DateTime } from 'luxon';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';

const Countdowns = () => {
    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<ICountdown>();
    const todayDatestamp = useTodayDatestamp();

    const saveEventOnDateSelectorClose = useRef(false);

    const [dateSelectOpen, setDateSelectOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    const todayMidnight = useMemo(
        () => datestampToMidnightDate(todayDatestamp),
        [todayDatestamp]
    );

    const listType = EListType.COUNTDOWN;

    const getCountownsMemoized = useCallback(getCountdowns, []);

    // ------------- Utility Functions -------------

    function initializeCountdown(item: IListItem): ICountdown {
        return {
            ...item,
            // Place textfield above the first countdown
            sortId: 0.5,
            startIso: DateTime.fromJSDate(todayMidnight).toISO()!
        }
    }

    function toggleDateSelector() {
        setDateSelectOpen(curr => !curr);

        if (saveEventOnDateSelectorClose.current) {
            setTextfieldItem(null);
            saveEventOnDateSelectorClose.current = false;
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
                                        await deleteCountdown(countdown);
                                        setTextfieldItem(null);
                                        setIsDeleteAlertOpen(false);
                                    }
                                }
                            ]
                        );
                    }
                }],
                [{
                    type: 'calendar',
                    onClick: toggleDateSelector
                }]],
            item: countdown
        }
    }

    const CountdownItems = useSortedList<ICountdown, ICountdown[]>({
        storageId: StorageKey.COUNTDOWN_LIST_KEY,
        storageKey: StorageKey.COUNTDOWN_LIST_KEY,
        getItemsFromStorageObject: getCountownsMemoized,
        storageConfig: {
            createItem: async (countdown) => {
                await saveCountdown(countdown, true);
            },
            updateItem: saveCountdown
        },
        handleListChange: async () => {
            await CountdownItems.refetchItems();
        },
        initializeListItem: initializeCountdown,
        reloadOnOverscroll: true,
        listType
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
                listType={listType}
                isLoading={CountdownItems.isLoading}
                items={CountdownItems.items}
                hideKeyboard={isDeleteAlertOpen || dateSelectOpen}
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
                        if (!textfieldItem) {
                            saveEventOnDateSelectorClose.current = true;
                            await CountdownItems.toggleItemEdit(item);
                        }
                        setDateSelectOpen(true);
                    },
                    customIcon: (
                        <View className='w-16'>
                            <DateValue concise isoTimestamp={item.startIso} />
                        </View>
                    )
                })}
                getRightIconConfig={(countdown) => ({
                    customIcon:
                        <View className="[width:55px] items-end">
                            <CustomText adjustsFontSizeToFit numberOfLines={1} type='soft'>
                                {daysBetweenToday(countdown.startIso)} days
                            </CustomText>
                        </View>
                })}
            />

            {/* Date Picker Modal */}
            <DateTimePicker
                mode='date'
                title={textfieldItem?.value}
                minimumDate={datestampToMidnightDate(getTodayDatestamp())}
                maximumDate={datestampToMidnightDate(getDatestampThreeYearsFromToday())}
                // open={dateSelectOpen && Boolean(textfieldItem)}
                value={
                    textfieldItem?.startIso
                        ? DateTime.fromISO(textfieldItem.startIso).toJSDate()
                        : todayMidnight
                }
            // onConfirm={(date) => {
            //     if (!textfieldItem) return;

            //     const selected = DateTime.fromJSDate(date);
            //     const updatedCountdown: ICountdown = {
            //         ...textfieldItem,
            //         startTime: selected.toISO()!
            //     };
            //     updatedCountdown.sortId = generateSortIdByTime(updatedCountdown, CountdownItems.items);

            //     if (saveEventOnDateSelectorClose.current) {
            //         CountdownItems.persistItemToStorage(updatedCountdown);
            //         setTextfieldItem(null);
            //         saveEventOnDateSelectorClose.current = false;
            //     } else {
            //         setTextfieldItem(updatedCountdown);
            //     }

            //     toggleDateSelector();
            // }}
            // onCancel={toggleDateSelector}
            />

        </View>
    );
};

export default Countdowns;