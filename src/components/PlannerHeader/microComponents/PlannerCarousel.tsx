// import useAppTheme from "@/hooks/useAppTheme";
// import { PLANNER_BANNER_PADDING, PLANNER_CAROUSEL_ICON_WIDTH } from "@/lib/constants/miscLayout";
// import { TPlannerPageParams } from "@/lib/types/routeParams/TPlannerPageParams";
// import { getDatestampRange } from "@/utils/dateUtils";
// import { DateTime } from "luxon";
// import { MotiText } from "moti";
// import { useEffect, useMemo, useState } from "react";
// import { useWindowDimensions, View } from "react-native";
// import Carousel from "react-native-reanimated-carousel";
// import Icon from "../../icons/Icon";
// import CustomText, { textStyles } from "../../text/CustomText";
// import PlannerCarouselWeek from "./PlannerCarouselWeek";

// /**
//  * Returns a 2D array of ISO datestamps (chunks of 7 days each)
//  * covering the range from the first day of the previous month
//  * to the last day of the next month (three months total).
//  */
// export function getNextFourWeeksOfDatestamps(): string[][] {
//     const now = DateTime.now();

//     const startOfWeek = now.startOf("week");
//     const threeWeeksAway = now.plus({ week: 3 }).endOf("week");

//     const allDates = getDatestampRange(
//         startOfWeek.toISODate()!,
//         threeWeeksAway.toISODate()!
//     );

//     // Split into weeks of 7 days.
//     const chunkedDates: string[][] = [];
//     for (let i = 0; i < allDates.length; i += 7) {
//         chunkedDates.push(allDates.slice(i, i + 7));
//     }

//     return chunkedDates;
// }

// const PlannerCarousel = ({ datestamp: currentDatestamp }: TPlannerPageParams) => {
//     const { width: SCREEN_WIDTH } = useWindowDimensions();

//     const [weeks, setWeeks] = useState(getNextFourWeeksOfDatestamps());
//     const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

//     const { startMonth, endMonth } = useMemo(() => ({
//         startMonth: DateTime.fromISO(weeks[currentWeekIndex][0]).toFormat('LLLL'),
//         endMonth: DateTime.fromISO(weeks[currentWeekIndex][6]).toFormat('LLLL')
//     }), [currentWeekIndex]);

//     const currentDatestampMonth = DateTime.fromISO(currentDatestamp).toFormat('LLLL');

//     return (
//         <View className='w-full' style={{ paddingHorizontal: PLANNER_BANNER_PADDING }}>

//             {/* Week Info */}
//             <View className="flex-row justify-between" style={{ paddingHorizontal: PLANNER_BANNER_PADDING }}>
//                 <View className="flex-row items-end">
//                     <MotiText
//                         style={textStyles["month"]}
//                         animate={{
//                             opacity: currentDatestampMonth === startMonth ? 1 : 0.5,
//                             scale: currentDatestampMonth === startMonth ? 1 : 0.875,
//                             marginRight: currentDatestampMonth === startMonth ? 5 : 0
//                         }}
//                     >
//                         {startMonth}
//                     </MotiText>
//                     {startMonth !== endMonth && (
//                         <>
//                             <CustomText
//                                 variant="month"
//                                 customStyle={{ opacity: 0.5, fontSize: 14 }}
//                             >
//                                 into
//                             </CustomText>
//                             <MotiText
//                                 style={textStyles['month']}
//                                 animate={{
//                                     opacity: currentDatestampMonth === endMonth ? 1 : 0.5,
//                                     scale: currentDatestampMonth === endMonth ? 1 : 0.875,
//                                     marginLeft: currentDatestampMonth === endMonth ? 5 : 0
//                                 }}
//                             >
//                                 {endMonth}
//                             </MotiText>
//                         </>
//                     )}
//                 </View>
//                 <Icon size={26} name='calendar' />
//             </View>

//             {/* Scroll Wheel */}
//             <Carousel
//                 data={weeks}
//                 renderItem={({ item: week }) => (
//                     <View style={{ width: SCREEN_WIDTH - PLANNER_BANNER_PADDING * 2 }}>
//                         <PlannerCarouselWeek
//                             datestamps={week}
//                             currentDatestamp={currentDatestamp}
//                         />
//                     </View>
//                 )}
//                 onSnapToItem={setCurrentWeekIndex}
//                 loop={false}
//                 width={SCREEN_WIDTH - PLANNER_BANNER_PADDING * 2}
//                 height={PLANNER_CAROUSEL_ICON_WIDTH}
//             />

//         </View>
//     )
// };

// export default PlannerCarousel;

import useAppTheme from "@/hooks/useAppTheme";
import { PLANNER_BANNER_PADDING, PLANNER_CAROUSEL_ICON_WIDTH } from "@/lib/constants/miscLayout";
import { TPlannerPageParams } from "@/lib/types/routeParams/TPlannerPageParams";
import { getDatestampRange } from "@/utils/dateUtils";
import { DateTime } from "luxon";
import { MotiText } from "moti";
import { useEffect, useMemo, useState } from "react";
import { PlatformColor, Text, useWindowDimensions, View } from "react-native";
import Carousel from "react-native-reanimated-carousel";
import Icon from "../../icons/Icon";
import CustomText, { textStyles } from "../../text/CustomText";
import PlannerCarouselWeek from "./PlannerCarouselWeek";

/**
 * Returns a 2D array of ISO datestamps (chunks of 7 days each)
 * starting from a given date and spanning N weeks forward.
 */
export function getWeeksFrom(startDate: DateTime, numberOfWeeks: number): string[][] {
    const endDate = startDate.plus({ weeks: numberOfWeeks - 1 }).endOf("week");
    const allDates = getDatestampRange(startDate.toISODate()!, endDate.toISODate()!);

    const chunkedDates: string[][] = [];
    for (let i = 0; i < allDates.length; i += 7) {
        chunkedDates.push(allDates.slice(i, i + 7));
    }
    return chunkedDates;
}

const PlannerCarousel = ({ datestamp: currentDatestamp }: TPlannerPageParams) => {
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    const initialWeeks = getWeeksFrom(DateTime.now().startOf("week"), 4);
    const [weeks, setWeeks] = useState(initialWeeks);
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

    // ✅ When we’re within 2 of the end, add 3 more weeks
    useEffect(() => {
        if (currentWeekIndex >= weeks.length - 2) {
            const lastWeekEnd = DateTime.fromISO(weeks[weeks.length - 1][6]).endOf("week");
            const newWeeks = getWeeksFrom(lastWeekEnd.plus({ days: 1 }), 3);
            setWeeks(prev => [...prev, ...newWeeks]);
        }
    }, [currentWeekIndex, weeks]);

    const { startMonth, endMonth } = useMemo(() => ({
        startMonth: DateTime.fromISO(weeks[currentWeekIndex][0]).toFormat("LLLL"),
        endMonth: DateTime.fromISO(weeks[currentWeekIndex][6]).toFormat("LLLL")
    }), [currentWeekIndex, weeks]);

    const currentDatestampMonth = DateTime.fromISO(currentDatestamp).toFormat("LLLL");

    return (
        <View className="w-full" style={{ paddingHorizontal: PLANNER_BANNER_PADDING }}>

            {/* Month Info */}
            <View className="flex-row justify-between" style={{ paddingHorizontal: PLANNER_BANNER_PADDING }}>
                <View className='flex-row'>
                    <CustomText variant="month">
                        <MotiText
                            style={[textStyles.month, { color: PlatformColor('label') }]}
                            animate={{
                                opacity: currentDatestampMonth === startMonth ? 1 : 0.5,
                                // @ts-ignore
                                fontSize: currentDatestampMonth === startMonth ? 16 : 14
                            }}
                        >
                            {startMonth}
                        </MotiText>

                        {startMonth !== endMonth && (
                            <>
                                <Text style={[textStyles.month,
                                { opacity: 0.5, fontSize: 14 }]}>
                                    {' into '}
                                </Text>
                                <MotiText
                                    style={[textStyles.month, { color: PlatformColor('label') }]}
                                    animate={{
                                        opacity: currentDatestampMonth === endMonth ? 1 : 0.5,
                                        // @ts-ignore
                                        fontSize: currentDatestampMonth === endMonth ? 16 : 14
                                    }}
                                >
                                    {endMonth}
                                </MotiText>
                            </>
                        )}
                    </CustomText>
                </View>
                <Icon size={26} name="calendar" />
            </View>

            {/* Scroll Wheel */}
            <Carousel
                data={weeks}
                renderItem={({ item: week }) => (
                    <View style={{ width: SCREEN_WIDTH - PLANNER_BANNER_PADDING * 2 }}>
                        <PlannerCarouselWeek
                            datestamps={week}
                            currentDatestamp={currentDatestamp}
                        />
                    </View>
                )}
                onSnapToItem={setCurrentWeekIndex}
                loop={false}
                width={SCREEN_WIDTH - PLANNER_BANNER_PADDING * 2}
                height={PLANNER_CAROUSEL_ICON_WIDTH}
            />
        </View>
    );
};

export default PlannerCarousel;
