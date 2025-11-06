// import { recurringTimeModalEventAtom } from '@/atoms/recurringTimeModalEvent';
// import useRecurringEventTimeParser from '@/hooks/recurring/useRecurringEventTimeParser';
// import useRecurringPlanner from '@/hooks/recurring/useRecurringPlanner';
// import useListItemToggle from '@/hooks/useListItemToggle';
// import { EPopupActionType } from '@/lib/enums/EPopupActionType';
// import { ERecurringPlannerId } from '@/lib/enums/ERecurringPlannerKey';
// import { EStorageId } from '@/lib/enums/EStorageId';
// import { IRecurringEvent } from '@/lib/types/listItems/IRecurringEvent';
// import { TPopupAction } from '@/lib/types/TPopupAction';
// import { useDeleteSchedulerContext } from '@/providers/DeleteScheduler';
// import { createRecurringEventInStorageAndFocusTextfield, deleteRecurringEventsFromStorageHideWeekday, upsertWeekdayEventToRecurringPlanners } from '@/utils/recurringPlannerUtils';
// import { useAtom } from 'jotai';
// import React, { useMemo, useState } from 'react';
// import { TouchableOpacity, View } from 'react-native';
// import { useMMKV } from 'react-native-mmkv';
// import TimeValue from '../components/text/TimeValue';

// // ✅

// const RecurringPlanner = () => {
//     const recurringEventStorage = useMMKV({ id: EStorageId.RECURRING_PLANNER_EVENT });

//     const [recurringTimeModalEvent, setRecurringTimeModalEvent] = useAtom(recurringTimeModalEventAtom);

//     const { onGetIsItemDeletingCallback } = useDeleteSchedulerContext();

//     const [recurringPlannerId, setRecurringPlannerId] = useState<ERecurringPlannerId>(ERecurringPlannerId.WEEKDAYS);

//     const recurringPlannerActions: TPopupAction[] = useMemo(() =>
//         Object.values(ERecurringPlannerId).map((title) => ({
//             type: EPopupActionType.BUTTON,
//             title,
//             onPress: () => setRecurringPlannerId(title),
//             value: recurringPlannerId === title
//         })),
//         [recurringPlannerId, recurringPlannerId]
//     );

//     const {
//         eventIds,
//         OverflowActionsIcon,
//         onUpdateRecurringEventIndexWithChronologicalCheck
//     } = useRecurringPlanner(recurringPlannerId);

//     const { onUpdateRecurringEventValueWithTimeParsing } = useRecurringEventTimeParser(recurringPlannerId, recurringEventStorage);

//     const isWeekdayPlanner = recurringPlannerId === ERecurringPlannerId.WEEKDAYS;

//     function getRecurringEventPlatformColor(recurringEvent: IRecurringEvent) {
//         if (getIsRecurringEventDisabled(recurringEvent)) {
//             return "tertiaryLabel";
//         }
//         return "label";
//     }

//     function getIsRecurringEventDisabled(recurringEvent: IRecurringEvent) {
//         return onGetIsItemDeletingCallback(recurringEvent) || !!recurringTimeModalEvent && recurringTimeModalEvent.id !== recurringEvent.id;
//     }

//     return (
//         <View className='flex-1'>
//             <View className='px-3 pt-3 flex-row justify-between items-center'>
//                 {/* <PopupList label={recurringPlannerId} actions={recurringPlannerActions} /> */}
//                 <OverflowActionsIcon />
//             </View>
//             <DragAndDropList<IRecurringEvent>
//                 listId={recurringPlannerId}
//                 fillSpace
//                 storage={recurringEventStorage}
//                 itemIds={eventIds}
//                 storageId={EStorageId.RECURRING_PLANNER_EVENT}
//                 onGetRowTextPlatformColor={getRecurringEventPlatformColor}
//                 onCreateItem={createRecurringEventInStorageAndFocusTextfield}
//                 onIndexChange={onUpdateRecurringEventIndexWithChronologicalCheck}
//                 onValueChange={onUpdateRecurringEventValueWithTimeParsing}
//                 onSaveToExternalStorage={isWeekdayPlanner ? upsertWeekdayEventToRecurringPlanners : undefined}
//                 onDeleteItem={(event) => deleteRecurringEventsFromStorageHideWeekday([event])}
//                 onGetRightIcon={(event) => event.startTime && (
//                     <TouchableOpacity onPress={() => setRecurringTimeModalEvent(event)}>
//                         <TimeValue disabled={getIsRecurringEventDisabled(event)} timeValue={event.startTime} />
//                     </TouchableOpacity>
//                 )}
//                 onGetLeftIcon={(event) => useListItemToggle(event)}
//             />
//         </View>
//     )
// };

// export default RecurringPlanner;
