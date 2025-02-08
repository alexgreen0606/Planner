import React, { useState } from 'react';
import { View } from 'react-native';
import { useSortableListContext } from '../../foundation/sortedLists/services/SortableListProvider';
import { daysBetweenToday, genericTimestampToMidnightDate, getTodayGenericTimestamp } from '../../foundation/calendar/dateUtils';
import globalStyles from '../../foundation/theme/globalStyles';
import SortableList from '../../foundation/sortedLists/components/list/SortableList';
import { Countdown, COUNTDOWN_LIST_KEY, deleteCountdown, getCountdowns, saveCountdown } from '../../feature/countdowns/countdownUtils';
import { isItemTextfield, ListItem } from '../../foundation/sortedLists/sortedListUtils';
import useSortedList from '../../foundation/sortedLists/hooks/useSortedList';
import DateValue from '../../foundation/calendar/components/DateValue';
import CustomText from '../../foundation/ui/text/CustomText';
import DatePicker from 'react-native-date-picker';
import CountdownBanner from '../../feature/countdowns/components/CountdownBanner';

const Countdowns = () => {
    const { currentTextfield, setCurrentTextfield } = useSortableListContext();
    const [dateSelectOpen, setDateSelectOpen] = useState(false);

    const todayMidnight = genericTimestampToMidnightDate(getTodayGenericTimestamp());

    function initializeCountdown(item: ListItem) {
        return {
            ...item,
            date: todayMidnight
        }
    };

    async function toggleDateSelector(countdown: Countdown) {
        if (!isItemTextfield(countdown))
            await CountdownItems.toggleItemEdit(countdown);
        setDateSelectOpen(curr => !curr);
    };

    const CountdownItems = useSortedList<Countdown, Countdown[]>(
        COUNTDOWN_LIST_KEY,
        COUNTDOWN_LIST_KEY,
        () => getCountdowns(),
        (list) => list,
        {
            create: (countdown) => {
                saveCountdown(countdown, true);
                CountdownItems.refetchItems();
            },
            update: (countdown) => {
                saveCountdown(countdown, false);
                CountdownItems.refetchItems();
            },
            delete: (countdown) => {
                deleteCountdown(countdown);
                CountdownItems.refetchItems();
            }
        }
    );

    return (
        <View style={globalStyles.blackFilledSpace}>

            {/* Banner */}
            <CountdownBanner />

            {/* Countdown List */}
            <SortableList<Countdown, never, never>
                listId={COUNTDOWN_LIST_KEY}
                fillSpace
                items={CountdownItems.items}
                getRightIconConfig={(item) => ({
                    onClick: toggleDateSelector,
                    customIcon: <DateValue timestamp={item.date.toISOString()} />
                })}
                initializeItem={initializeCountdown}
                onDeleteItem={CountdownItems.deleteItemFromStorage}
                onContentClick={CountdownItems.toggleItemEdit}
                getTextfieldKey={(item) => `${item.id}-${item.sortId}`}
                onSaveTextfield={CountdownItems.persistItemToStorage}
                onDragEnd={CountdownItems.persistItemToStorage} // todo no dragging
                emptyLabelConfig={{
                    label: 'No Countdowns',
                    style: { flex: 1 }
                }}
                getLeftIconConfig={(countdown) => ({
                    customIcon:
                        <CustomText adjustsFontSizeToFit numberOfLines={1} style={{ width: 55 }} type='soft'>
                            {daysBetweenToday(countdown.date)} days
                        </CustomText>
                })}
            />

            {/* Date Picker Modal */}
            <DatePicker
                modal
                mode='date'
                title={`"${currentTextfield?.value}" Countdown`}
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
        </View>
    );
};

export default Countdowns;