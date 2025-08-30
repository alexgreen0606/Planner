import { textfieldIdAtom } from '@/atoms/textfieldId';
import CustomText from '@/components/text/CustomText';
import DateValue from '@/components/text/DateValue';
import { EStorageId } from '@/lib/enums/EStorageId';
import { EStorageKey } from '@/lib/enums/EStorageKey';
import { ICountdownEvent } from '@/lib/types/listItems/ICountdownEvent';
import { deleteCountdownAndReloadCalendar, updateDeviceCalendarEventByCountdownEvent } from '@/utils/countdownUtils';
import { getDaysUntilIso } from '@/utils/dateUtils';
import { useSetAtom } from 'jotai';
import React from 'react';
import { View } from 'react-native';
import { useMMKV } from 'react-native-mmkv';
import DragAndDropList from './components/DragAndDropList';
import useCountdownPlanner from '@/hooks/useCountdownPlanner';

// ✅ 

const Countdowns = () => {
    const countdownEventStorage = useMMKV({ id: EStorageId.COUNTDOWN_EVENT });

    const setTextfieldId = useSetAtom(textfieldIdAtom);

    const {
        toolbarIcons,
        countdownEventIds,
        isLoading,
        onCreateCountdownEventInStorageAndFocusTextfield,
        onUpdateCountdownEventIndexWithChronologicalCheck
    } = useCountdownPlanner(countdownEventStorage);

    return (
        <DragAndDropList<ICountdownEvent>
            listId={EStorageKey.COUNTDOWN_LIST_KEY}
            fillSpace
            itemIds={countdownEventIds}
            storageId={EStorageId.COUNTDOWN_EVENT}
            isLoading={isLoading}
            storage={countdownEventStorage}
            toolbarIconSet={toolbarIcons}
            onGetLeftIconConfig={(item) => ({
                onClick: () => setTextfieldId(item.id),
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
                            {getDaysUntilIso(countdown.startIso)} days
                        </CustomText>
                    </View>
            })}
            emptyLabelConfig={{
                label: 'No countdowns',
                className: 'flex-1'
            }}
            onCreateItem={(_, index) => onCreateCountdownEventInStorageAndFocusTextfield(index)}
            onSaveToExternalStorage={updateDeviceCalendarEventByCountdownEvent}
            onDeleteItem={deleteCountdownAndReloadCalendar}
            onIndexChange={onUpdateCountdownEventIndexWithChronologicalCheck}
        />
    )
};

export default Countdowns;