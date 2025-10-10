import { countdownDateModalEventAtom } from '@/atoms/countdownDateModalEvent';
import { userAccessAtom } from '@/atoms/userAccess';
import EmptyLabel from '@/components/EmptyLabel';
import DraggableListPage from '@/components/DraggableListPage';
import CustomText from '@/components/text/CustomText';
import DateValue from '@/components/text/DateValue';
import CountdownEventToolbar from '@/components/toolbars/CountdownEventToolbar';
import useCountdownPlanner from '@/hooks/useCountdownPlanner';
import { EAccess } from '@/lib/enums/EAccess';
import { EStorageId } from '@/lib/enums/EStorageId';
import { EStorageKey } from '@/lib/enums/EStorageKey';
import { ICountdownEvent } from '@/lib/types/listItems/ICountdownEvent';
import { useDeleteSchedulerContext } from '@/providers/DeleteScheduler';
import { deleteCountdownAndReloadCalendar, updateDeviceCalendarEventByCountdownEvent } from '@/utils/countdownUtils';
import { getDaysUntilIso } from '@/utils/dateUtils';
import { useAtom, useAtomValue } from 'jotai';
import React from 'react';
import { PlatformColor, TouchableOpacity, View } from 'react-native';
import { useMMKV } from 'react-native-mmkv';

// ✅ 

const UpcomingDatesPage = () => {
    const countdownEventStorage = useMMKV({ id: EStorageId.COUNTDOWN_EVENT });

    const userAccess = useAtomValue(userAccessAtom);
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
        <View className='flex-1'>
            {userAccess.get(EAccess.CALENDAR) ? (
                <DraggableListPage
                    toolbar={<CountdownEventToolbar />}
                    emptyPageLabelProps={{ label: 'No upcoming dates' }}
                    listId={EStorageKey.COUNTDOWN_LIST_KEY}
                    itemIds={countdownEventIds}
                    storageId={EStorageId.COUNTDOWN_EVENT}
                    storage={countdownEventStorage}
                    onGetLeftIcon={(event) => (
                        <TouchableOpacity onPress={() => setCountdownDateModalEvent(event)} className='w-16'>
                            <DateValue platformColor={event.color} disabled={getIsCountdownEventDisabled(event)} isoTimestamp={event.startIso} />
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
            ) : (
                <View className='flex-1 items-center justify-center'>
                    <EmptyLabel
                        label='Calendar access required.' // todo: open settings on click
                        iconProps={{
                            name: 'exclamationmark',
                            color: 'tertiaryLabel'
                        }}
                    />
                </View>
            )}
        </View>
    )
};

export default UpcomingDatesPage;