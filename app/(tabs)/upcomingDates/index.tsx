import { upcomingDateDateModalEventAtom } from '@/atoms/upcomingDateDateModalEventAtom';
import { userAccessAtom } from '@/atoms/userAccess';
import CalendarFilters from '@/components/CalendarFilters';
import DraggableListPage from '@/components/DraggableListPage';
import EmptyLabel from '@/components/EmptyLabel';
import CustomText from '@/components/text/CustomText';
import DateValue from '@/components/text/DateValue';
import UpcomingDateToolbar from '@/components/toolbars/UpcomingDateToolbar';
import useUpcomingEvents from '@/hooks/useUpcomingEvents';
import { EAccess } from '@/lib/enums/EAccess';
import { EStorageId } from '@/lib/enums/EStorageId';
import { EStorageKey } from '@/lib/enums/EStorageKey';
import { IUpcomingDate } from '@/lib/types/listItems/IUpcomingDate';
import { useDeleteSchedulerContext } from '@/providers/DeleteScheduler';
import { getDaysUntilIso } from '@/utils/dateUtils';
import { deleteUpcomingDateAndReloadCalendar, updateDeviceCalendarEventByUpcomingDateEvent } from '@/utils/upcomingDateUtils';
import { useAtom, useAtomValue } from 'jotai';
import React, { useCallback, useState } from 'react';
import { PlatformColor, TouchableOpacity, View } from 'react-native';
import { useMMKV } from 'react-native-mmkv';

// ✅ 

const UpcomingDatesPage = () => {
    const upcomingDateEventStorage = useMMKV({ id: EStorageId.UPCOMING_DATE_EVENT });

    const userAccess = useAtomValue(userAccessAtom);
    const [upcomingDateDateModalEvent, setUpcomingDateDateModalEvent] = useAtom(upcomingDateDateModalEventAtom);

    const { onGetIsItemDeletingCallback } = useDeleteSchedulerContext();

    const {
        upcomingDateEventIds,
        onCreateUpcomingDateEventInStorageAndFocusTextfield
    } = useUpcomingEvents(upcomingDateEventStorage);

    function getUpcomingDateEventPlatformColor(upcomingDateEvent: IUpcomingDate) {
        if (getIsUpcomingDateEventDisabled(upcomingDateEvent)) {
            return "tertiaryLabel";
        }
        return "label";
    }

    function getIsUpcomingDateEventDisabled(upcomingDateEvent: IUpcomingDate) {
        return onGetIsItemDeletingCallback(upcomingDateEvent) || !!upcomingDateDateModalEvent && upcomingDateDateModalEvent.id !== upcomingDateEvent.id;
    }

    return (
        <View className='flex-1'>
            {userAccess.get(EAccess.CALENDAR) ? (
                <DraggableListPage
                    toolbar={<UpcomingDateToolbar />}
                    emptyPageLabelProps={{ label: 'No upcoming dates' }}
                    listId={EStorageKey.UPCOMING_DATE_LIST_KEY}
                    itemIds={upcomingDateEventIds}
                    storageId={EStorageId.UPCOMING_DATE_EVENT}
                    storage={upcomingDateEventStorage}
                    onGetLeftIcon={(event) => (
                        <TouchableOpacity
                            activeOpacity={event.editable ? 0.8 : 1}
                            onPress={() => event.editable && setUpcomingDateDateModalEvent(event)}
                            style={{ width: 57 }}
                            className='items-center'
                        >
                            <DateValue platformColor={event.color} disabled={getIsUpcomingDateEventDisabled(event)} isoTimestamp={event.startIso} />
                        </TouchableOpacity>
                    )}
                    onGetRightIcon={(upcomingDate) => (
                        <View className="w-16 items-end">
                            <CustomText
                                adjustsFontSizeToFit
                                numberOfLines={1}
                                variant='microDetail'
                                customStyle={getIsUpcomingDateEventDisabled(upcomingDate) ? { color: PlatformColor('tertiaryLabel') } : undefined}
                            >
                                {getDaysUntilIso(upcomingDate.startIso)} days
                            </CustomText>
                        </View>
                    )}
                    onGetRowTextPlatformColor={getUpcomingDateEventPlatformColor}
                    onCreateItem={(_, index) => onCreateUpcomingDateEventInStorageAndFocusTextfield(index)}
                    onSaveToExternalStorage={updateDeviceCalendarEventByUpcomingDateEvent}
                    onDeleteItem={deleteUpcomingDateAndReloadCalendar}
                    onGetIsEditable={(item) => item.editable}
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