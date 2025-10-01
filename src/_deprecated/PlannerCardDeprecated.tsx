// import useIsPlannerEventDeleting from '@/hooks/planners/useIsPlannerEventDeleting';
// import usePlanner from '@/hooks/planners/usePlanner';
// import usePlannerEventTimeParser from '@/hooks/planners/usePlannerEventTimeParser';
// import useGetPlannerEventToggle from '@/hooks/planners/usePlannerEventToggle';
// import { BOTTOM_NAVIGATION_HEIGHT, HEADER_HEIGHT, PLANNER_CARD_HEADER_HEIGHT } from '@/lib/constants/miscLayout';
// import { EStorageId } from '@/lib/enums/EStorageId';
// import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
// import { ScrollProvider } from '@/providers/ScrollProvider';
// import { Host, HStack, Spacer, VStack } from '@expo/ui/swift-ui';
// import { cornerRadius, frame, glassEffect } from '@expo/ui/swift-ui/modifiers';
// import { SPACING } from 'app/(tabs)/planners/deprecatedPlannersPage';
// import React, { useEffect, useState } from 'react';
// import { PlatformColor, StyleSheet, useWindowDimensions, View } from 'react-native';
// import { useMMKV } from 'react-native-mmkv';
// import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
// import { createPlannerEventInStorageAndFocusTextfield, createPlannerEventTimeIcon, deletePlannerEventsFromStorageAndCalendar, updateDeviceCalendarEventByPlannerEvent } from '../../utils/plannerUtils';
// import PlannerCard from '../PlannerCard';
// import DragAndDropList from './components/DragAndDropList';

// // ✅ 

// type TPlannerCardProps = {
//     index: number;
//     datestamp: string;
//     scrollX: SharedValue<number>;
// };

// const PositionContainer = Animated.createAnimatedComponent(View);

// const PlannerCard = ({ datestamp, scrollX, index }: TPlannerCardProps) => {
//     const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = useWindowDimensions();
//     const eventStorage = useMMKV({ id: EStorageId.PLANNER_EVENT });

//     const [collapsed, setCollapsed] = useState(true);

//     const scrollY = useSharedValue(0);

//     const {
//         planner,
//         isEditingTitle,
//         isPlannerFocused,
//         onEditTitle,
//         OverflowActionsIcon,
//         onCloseTextfield,
//         onToggleEditTitle,
//         onUpdatePlannerEventIndexWithChronologicalCheck
//     } = usePlanner(datestamp, eventStorage);

//     const { onUpdatePlannerEventValueWithTimeParsing } = usePlannerEventTimeParser(datestamp, eventStorage);

//     const CARD_WIDTH = SCREEN_WIDTH - SPACING * 2;

//     const positionStyle = useAnimatedStyle(() => {
//         const cardCenter = index * (CARD_WIDTH + SPACING);
//         const scrollCenter = scrollX.value;

//         return {
//             left: (cardCenter) + SPACING,
//             top: SPACING,
//         };
//     });


//     useEffect(() => {
//         if (isPlannerFocused && collapsed) {
//             handleToggleCollapsed(false);
//         }
//     }, [isPlannerFocused]);

//     function handleToggleCollapsed(closeTextfield: boolean = true) {
//         if (isPlannerFocused && closeTextfield) {
//             onCloseTextfield();
//         }

//         setCollapsed(curr => !curr);
//     }

//     return (
//         <PositionContainer className='absolute top-0' style={positionStyle}>
//             <View className='roundex-xl overflow-hidden relative'
//                 style={{
//                     height: SCREEN_HEIGHT - 80 - HEADER_HEIGHT - BOTTOM_NAVIGATION_HEIGHT - HEADER_HEIGHT,
//                     width: CARD_WIDTH,
//                 }}>
//                 <ScrollProvider scrollOffset={scrollY} contentContainerStyle={{
//                     paddingTop: PLANNER_CARD_HEADER_HEIGHT,
//                     flexGrow: 1,
//                     backgroundColor: PlatformColor('systemBackground'),
//                     borderLeftWidth: StyleSheet.hairlineWidth,
//                     borderLeftColor: PlatformColor('systemGray'),
//                     borderRightWidth: StyleSheet.hairlineWidth,
//                     borderRightColor: PlatformColor('systemGray')
//                 }}>
//                     <DragAndDropList<IPlannerEvent>
//                         listId={datestamp}
//                         itemIds={planner.eventIds}
//                         storageId={EStorageId.PLANNER_EVENT}
//                         storage={eventStorage}
//                         fillSpace
//                         emptyLabelConfig={{
//                             label: 'No plans',
//                             className: 'flex-1 justify-center items-center'
//                         }}
//                         onValueChange={onUpdatePlannerEventValueWithTimeParsing}
//                         onIndexChange={onUpdatePlannerEventIndexWithChronologicalCheck}
//                         onCreateItem={createPlannerEventInStorageAndFocusTextfield}
//                         onDeleteItem={(event) => deletePlannerEventsFromStorageAndCalendar([event])}
//                         onSaveToExternalStorage={updateDeviceCalendarEventByPlannerEvent}
//                         onGetRightIcon={createPlannerEventTimeIcon}
//                         onGetLeftIcon={useGetPlannerEventToggle}
//                         onGetIsItemDeletingCustom={useIsPlannerEventDeleting}
//                     />
//                 </ScrollProvider>

//                 {/* Overflow Banner */}
//                 <Host style={{ position: 'absolute', bottom: 0, width: '100%', height: 30, padding: 8 }}>
//                     <HStack modifiers={[glassEffect({ glass: { variant: 'regular' }, shape: 'rectangle' }), frame({ alignment: 'trailing' })]}>
//                         <OverflowActionsIcon />
//                     </HStack>
//                 </Host>

//                 {/* Day Banner */}
//                 <PlannerCard
//                     planner={planner}
//                     collapsed={collapsed}
//                     isEditingTitle={isEditingTitle}
//                     onEditTitle={onEditTitle}
//                     onToggleEditTitle={onToggleEditTitle}
//                     onToggleCollapsed={handleToggleCollapsed}
//                 />
//             </View>
//         </PositionContainer>
//     )
// };

// export default PlannerCard;
