// import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
// import PlannerCard from '@/components/lists/PlannerCardDeprecated';
// import { SCROLL_THROTTLE } from '@/lib/constants/listConstants';
// import { useAtomValue } from 'jotai';
// import React from 'react';
// import { FlatList, useWindowDimensions, View } from 'react-native';
// import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

// // ✅ 

// export const SPACING = 16;

// const HorizontalScrollContainer = Animated.createAnimatedComponent(FlatList<string>);

// const Planners = () => {
//     const { width: SCREEN_WIDTH } = useWindowDimensions();
//     // const plannerSetStorage = useMMKV({ id: EStorageId.PLANNER_SETS });
//     // const router = useRouter();

//     // const [plannerSetKey, setPlannerSetKey] = useAtom(plannerSetKeyAtom);
//     const { planner } = useAtomValue(mountedDatestampsAtom);

//     // function buildPlannerSetActions(): TPopupAction[] {
//     //     const allPlannerSetTitles = getAllPlannerSetTitles();
//     //     return ['Next 7 Days', ...allPlannerSetTitles].map((title) => ({
//     //         title,
//     //         type: EPopupActionType.BUTTON,
//     //         onPress: () => setPlannerSetKey(title),
//     //         value: plannerSetKey === title
//     //     }));
//     // }

//     // const [plannerSetActions, setPlannerSetActions] = useState<TPopupAction[]>(buildPlannerSetActions());

//     const scrollOffsetX = useSharedValue(0);

//     const CARD_WIDTH = SCREEN_WIDTH - SPACING * 2;

//     // Re-build the list of planner set options whenever they change in storage.
//     // useMMKVListener(() => {
//     //     setPlannerSetActions(buildPlannerSetActions());
//     // }, plannerSetStorage);

//     // // Re-build the list of planner set options whenever the selected planner set changes.
//     // useEffect(() => {
//     //     setPlannerSetActions(buildPlannerSetActions());
//     // }, [plannerSetKey]);

//     const scrollHandler = useAnimatedScrollHandler({
//         onScroll: (event) => {
//             scrollOffsetX.value = event.contentOffset.x;
//         },
//     });

//     // Re-build list whenever storage changes
//     // useMMKVListener(() => {
//     //     setPlannerSetActions(buildPlannerSetActions());
//     // }, plannerSetStorage);

//     return (
//         <View className='flex-1'>

//             {/* Planner Set Display */}
//             <HorizontalScrollContainer
//                 data={planner}
//                 keyExtractor={(datestamp) => `${datestamp}-planner`}
//                 horizontal
//                 showsHorizontalScrollIndicator={false}
//                 decelerationRate='fast'
//                 snapToInterval={CARD_WIDTH + SPACING}
//                 bounces={false}
//                 scrollEventThrottle={SCROLL_THROTTLE}
//                 onScroll={scrollHandler}
//                 contentContainerStyle={{
//                     width: CARD_WIDTH * planner.length + SPACING,
//                 }}
//                 renderItem={({ item: datestamp, index }) => {
//                     return (
//                         <PlannerCard index={index} scrollX={scrollOffsetX} datestamp={datestamp} />
//                     );
//                 }}
//             />

//         </View>
//     )
// };

// export default Planners;
