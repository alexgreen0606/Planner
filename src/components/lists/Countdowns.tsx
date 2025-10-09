import { countdownDateModalEventAtom } from '@/atoms/countdownDateModalEvent';
import CustomText from '@/components/text/CustomText';
import DateValue from '@/components/text/DateValue';
import useCountdownPlanner from '@/hooks/useCountdownPlanner';
import { EStorageId } from '@/lib/enums/EStorageId';
import { EStorageKey } from '@/lib/enums/EStorageKey';
import { ICountdownEvent } from '@/lib/types/listItems/ICountdownEvent';
import { useDeleteSchedulerContext } from '@/providers/DeleteScheduler';
import { deleteCountdownAndReloadCalendar, updateDeviceCalendarEventByCountdownEvent } from '@/utils/countdownUtils';
import { getDaysUntilIso } from '@/utils/dateUtils';
import { useAtom } from 'jotai';
import React from 'react';
import { PlatformColor, TouchableOpacity, View } from 'react-native';
import { useMMKV } from 'react-native-mmkv';
import DragAndDropList from '../../_deprecated/DEP_DragAndDropList';

// ✅ 

const Countdowns = () => {
    const countdownEventStorage = useMMKV({ id: EStorageId.COUNTDOWN_EVENT });

    const [countdownDateModalEvent, setCountdownDateModalEvent] = useAtom(countdownDateModalEventAtom);

    const { onGetIsItemDeletingCallback } = useDeleteSchedulerContext();

    const {
        countdownEventIds,
        onCreateCountdownEventInStorageAndFocusTextfield,
        onUpdateCountdownEventIndexWithChronologicalCheck
    } = useCountdownPlanner(countdownEventStorage);

    function getCountdownEventPlatformColor(countdownEvent: ICountdownEvent) {
        if (getIsCountdownEventDisabled(countdownEvent)) {
            return "tertiaryLabel";
        }
        return "label";
    }

    function getIsCountdownEventDisabled(countdownEvent: ICountdownEvent) {
        return onGetIsItemDeletingCallback(countdownEvent) || !!countdownDateModalEvent && countdownDateModalEvent.id !== countdownEvent.id;
    }

    return (
        <DragAndDropList<ICountdownEvent>
            listId={EStorageKey.COUNTDOWN_LIST_KEY}
            fillSpace
            itemIds={countdownEventIds}
            storageId={EStorageId.COUNTDOWN_EVENT}
            storage={countdownEventStorage}
            onGetLeftIcon={(event) => (
                <TouchableOpacity onPress={() => setCountdownDateModalEvent(event)} className='w-16'>
                    <DateValue disabled={getIsCountdownEventDisabled(event)} isoTimestamp={event.startIso} />
                </TouchableOpacity>
            )}
            onGetRightIcon={(countdown) => (
                <View className="w-16 items-end">
                    <CustomText
                        adjustsFontSizeToFit
                        numberOfLines={1}
                        variant='microDetail'
                        customStyle={getIsCountdownEventDisabled(countdown) ? { color: PlatformColor('tertiaryLabel') } : undefined}
                    >
                        {getDaysUntilIso(countdown.startIso)} days
                    </CustomText>
                </View>
            )}
            onGetRowTextPlatformColor={getCountdownEventPlatformColor}
            onCreateItem={(_, index) => onCreateCountdownEventInStorageAndFocusTextfield(index)}
            onSaveToExternalStorage={updateDeviceCalendarEventByCountdownEvent}
            onDeleteItem={deleteCountdownAndReloadCalendar}
            onIndexChange={onUpdateCountdownEventIndexWithChronologicalCheck}
        />
    )
};

export default Countdowns;