import { CONTAINER_HORIZONTAL_MARGIN, PLANNER_CAROUSEL_ICON_WIDTH } from "@/lib/constants/miscLayout";
import { TPlannerPageParams } from "@/lib/types/routeParams/TPlannerPageParams";
import { getDatestampRange } from "@/utils/dateUtils";
import { Host, VStack } from "@expo/ui/swift-ui";
import { cornerRadius, glassEffect } from "@expo/ui/swift-ui/modifiers";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import Carousel from "react-native-reanimated-carousel";
import Icon from "../../icons/Icon";
import CustomText from "../../text/CustomText";
import PlannerCarouselWeek from "./PlannerCarouselWeek";

/**
 * Returns a 2D array of ISO datestamps (chunks of 7 days each)
 * starting from a given date and spanning N weeks forward.
 */
export function getWeeksFrom(startDate: DateTime, numberOfWeeks: number): string[][] {
    const endDate = startDate.plus({ weeks: numberOfWeeks - 1 }).endOf("week").minus({ day: 1 });
    const allDates = getDatestampRange(startDate.toISODate()!, endDate.toISODate()!);

    const chunkedDates: string[][] = [];
    for (let i = 0; i < allDates.length; i += 7) {
        chunkedDates.push(allDates.slice(i, i + 7));
    }
    return chunkedDates;
}

function findWeekIndex(weeks: string[][], target: string) {
    return weeks.findIndex(week => week.includes(target));
}

const PlannerCarousel = ({ datestamp: currentDatestamp }: TPlannerPageParams) => {
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    const [weeks, setWeeks] = useState(getWeeksFrom(DateTime.now().startOf("week").minus({ day: 1 }), 4));
    const [currentWeekIndex, setCurrentWeekIndex] = useState(findWeekIndex(weeks, currentDatestamp));

    // Add 3 more weeks when nearing the end of the list.
    useEffect(() => {
        if (currentWeekIndex >= weeks.length - 2) {
            const lastWeekEnd = DateTime.fromISO(weeks[weeks.length - 1][6]).endOf("week");
            const newWeeks = getWeeksFrom(lastWeekEnd, 3);
            setWeeks(prev => [...prev, ...newWeeks]);
        }
    }, [currentWeekIndex, weeks]);

    const { startMonth, startYear, endMonth, endYear } = useMemo(() => ({
        startYear: DateTime.fromISO(weeks[currentWeekIndex][0]).toFormat("yyyy"),
        startMonth: DateTime.fromISO(weeks[currentWeekIndex][0]).toFormat("LLLL"),
        endMonth: DateTime.fromISO(weeks[currentWeekIndex][6]).toFormat("LLLL"),
        endYear: DateTime.fromISO(weeks[currentWeekIndex][6]).toFormat("yyyy")
    }), [currentWeekIndex]);

    return (
        <Host>
            <VStack modifiers={[glassEffect({ glass: { variant: 'regular' }, shape: 'rectangle' }), cornerRadius(8)]}>
                <View className="w-full py-2">

                    {/* Week Info */}
                    <View className="flex-row justify-between items-center px-4">
                        <CustomText variant="month">
                            {startMonth}{startYear !== endYear && ` ${startYear}`}{startMonth !== endMonth && ` / ${endMonth}`} {endYear}
                        </CustomText>
                        <Icon size={22} name="calendar" />
                    </View>

                    {/* Scroll Wheel */}
                    <Carousel
                        data={weeks}
                        renderItem={({ item: week }) => (
                            <View style={{ width: SCREEN_WIDTH - CONTAINER_HORIZONTAL_MARGIN * 4, marginLeft: CONTAINER_HORIZONTAL_MARGIN }}>
                                <PlannerCarouselWeek
                                    datestamps={week}
                                    currentDatestamp={currentDatestamp}
                                />
                            </View>
                        )}
                        onSnapToItem={setCurrentWeekIndex}
                        loop={false}
                        defaultIndex={currentWeekIndex}
                        width={SCREEN_WIDTH - CONTAINER_HORIZONTAL_MARGIN * 2}
                        height={PLANNER_CAROUSEL_ICON_WIDTH}
                    />

                </View>
            </VStack>
        </Host>
    );
};

export default PlannerCarousel;
