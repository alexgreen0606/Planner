import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import CustomText from '@/components/text/CustomText';
import DateValue from '@/components/text/DateValue';
import useSortedList from '@/hooks/useSortedList';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { EListType } from '@/lib/enums/EListType';
import { EStorageKey } from '@/lib/enums/EStorageKey';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { ICountdown } from '@/lib/types/listItems/ICountdown';
import { deleteCountdown, getCountdowns, saveCountdown } from '@/utils/countdownUtils';
import { datestampToMidnightDate, daysBetweenToday, getDatestampThreeYearsFromToday, getTodayDatestamp } from '@/utils/dateUtils';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAtomValue } from 'jotai';
import { DateTime } from 'luxon';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { IconType } from '../icon';
import SortableList from './components/SortableList';
import { ToolbarIcon } from './components/ListToolbar';
import { generateSortIdByTime } from '@/utils/plannerUtils';

// ✅ 

const Countdowns = () => {
    const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);

    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<ICountdown>();

    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

    const todayMidnight = useMemo(
        () => datestampToMidnightDate(todayDatestamp),
        [todayDatestamp]
    );

    const getCountownsMemoized = useCallback(getCountdowns, []);

    const listType = EListType.COUNTDOWN;

    const toolbarIcons: ToolbarIcon<ICountdown>[][] = [
        [{
            type: 'trash' as IconType,
            onClick: () => {
                setIsDeleteAlertOpen(true);
                Alert.alert(
                    `Delete "${textfieldItem?.value}"?`,
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
                                if (!textfieldItem) return;
                                await deleteCountdown(textfieldItem);
                                setTextfieldItem(null);
                                setIsDeleteAlertOpen(false);
                            }
                        }
                    ]
                );
            }
        }],
        [{
            type: 'calendar' as IconType,
            customIcon: (
                <DateTimePicker
                    mode='date'
                    value={
                        textfieldItem
                            ? DateTime.fromISO(textfieldItem.startIso).toJSDate()
                            : todayMidnight
                    }
                    onChange={handleDateSelect}
                    minimumDate={datestampToMidnightDate(getTodayDatestamp())}
                    maximumDate={datestampToMidnightDate(getDatestampThreeYearsFromToday())}
                />
            )
        }]];

    // ==================
    // 1. Event Handler
    // ==================

    function handleDateSelect(event: DateTimePickerEvent) {
        if (!textfieldItem) return;

        const { timestamp } = event.nativeEvent;
        const selected = DateTime.fromMillis(timestamp).startOf('day');

        setTextfieldItem({
            ...textfieldItem,
            startIso: selected.toUTC().toISO()!
        });
    }

    // ====================
    // 2. Helper Function
    // ====================

    function initializeCountdown(item: TListItem): ICountdown {
        return {
            ...item,
            // Place textfield above the first countdown
            sortId: 0.5,
            startIso: DateTime.fromJSDate(todayMidnight).toISO()!
        }
    }

    // ===================
    // 3. List Generation
    // ===================

    const CountdownItems = useSortedList<ICountdown, ICountdown[]>({
        storageId: EStorageKey.COUNTDOWN_LIST_KEY,
        storageKey: EStorageKey.COUNTDOWN_LIST_KEY,
        onGetItemsFromStorageObject: getCountownsMemoized,
        onSaveItemToStorage: saveCountdown,
        onHandleListChange: async () => {
            await CountdownItems.refetchItems();
        },
        onInitializeListItem: initializeCountdown,
        listType
    });

    // =======
    // 4. UI
    // =======

    return (
        <View className='flex-1'>

            {/* Countdown List */}
            <SortableList<ICountdown>
                listId={EStorageKey.COUNTDOWN_LIST_KEY}
                fillSpace
                disableDrag
                listType={listType}
                isLoading={CountdownItems.isLoading}
                items={CountdownItems.items}
                hideKeyboard={isDeleteAlertOpen}
                onContentClick={CountdownItems.toggleItemEdit}
                onSaveTextfieldAndCreateNew={CountdownItems.saveTextfieldAndCreateNew}
                toolbarIconSet={toolbarIcons}
                onGetLeftIconConfig={(item) => ({
                    onClick: CountdownItems.toggleItemEdit,
                    customIcon: (
                        <View className='w-16'>
                            <DateValue concise isoTimestamp={item.startIso} />
                        </View>
                    )
                })}
                onGetRightIconConfig={(countdown) => ({
                    customIcon:
                        <View className="[width:55px] items-end">
                            <CustomText adjustsFontSizeToFit numberOfLines={1} variant='microDetail'>
                                {daysBetweenToday(countdown.startIso)} days
                            </CustomText>
                        </View>
                })}
                emptyLabelConfig={{
                    label: 'No countdowns',
                    className: 'flex-1'
                }}
            />

        </View>
    );
};

export default Countdowns;