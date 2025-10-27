import { PLANNER_CAROUSEL_HEIGHT, PLANNER_CAROUSEL_ICON_WIDTH } from "@/lib/constants/miscLayout";
import { DateTime } from "luxon";
import { useMemo } from "react";
import { PlatformColor, Pressable, useWindowDimensions } from "react-native";
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle } from "react-native-reanimated";
import CustomText from "../text/CustomText";

// ✅ 

type TPlannerDateIconProps = {
    datestamp: string;
    isCurrentDatestamp: boolean;
    scrollX: SharedValue<number>;
    isScrolling: boolean;
    index: number;
    onPress: () => void;
};

const PlannerDateIcon = ({ 
    datestamp, 
    scrollX, 
    isCurrentDatestamp, 
    isScrolling, 
    index, 
    onPress 
}: TPlannerDateIconProps) => {
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    const { day, dayOfWeek, month } = useMemo(() => {
        const date = DateTime.fromISO(datestamp);
        return {
            month: date.toFormat('MMM').toUpperCase(),
            day: date.toFormat('d'),
            dayOfWeek: date.toFormat('ccc').toUpperCase()
        }
    }, [datestamp]);

    const PLANNER_CAROUSEL_ITEM_WIDTH = SCREEN_WIDTH / 8;
    const focusedScrollX = index * PLANNER_CAROUSEL_ITEM_WIDTH;

    const animatedContainerStyle = useAnimatedStyle(() => {
        const distance = Math.abs(scrollX.value - focusedScrollX);
        const ranges = [0, SCREEN_WIDTH / 2];

        const scale = interpolate(
            distance,
            ranges,
            [1, 0.7],
            Extrapolation.CLAMP
        );

        const opacity = interpolate(
            distance,
            ranges,
            [1, 0.1],
            Extrapolation.CLAMP
        );

        return {
            opacity,
            transform: [{ scale }],
        }
    });

    return (
        <Animated.View style={[{
            width: PLANNER_CAROUSEL_ICON_WIDTH,
            height: PLANNER_CAROUSEL_HEIGHT,
            justifyContent: 'center'
        }]}>
            <Pressable
                onPress={onPress}
                style={{ width: PLANNER_CAROUSEL_ICON_WIDTH, height: PLANNER_CAROUSEL_ICON_WIDTH }}
                className='w-full h-full items-center pt-[0.3rem]'
            >
                <CustomText
                    variant='dayOfWeek'
                    customStyle={{ color: PlatformColor(isCurrentDatestamp && !isScrolling ? 'systemBackground' : 'label') }}
                >
                    {dayOfWeek}
                </CustomText>
                <CustomText variant='dayOfMonth'>
                    {day}
                </CustomText>
            </Pressable>
        </Animated.View>
    )
}

export default PlannerDateIcon;