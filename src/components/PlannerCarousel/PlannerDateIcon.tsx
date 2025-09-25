import { currentPlannerDatestamp } from "@/atoms/currentPlannerDatestamp";
import useAppTheme from "@/hooks/useAppTheme";
import { PLANNER_CAROUSEL_ICON_WIDTH, PLANNER_CAROUSEL_ITEM_WIDTH } from "@/lib/constants/miscLayout";
import { useAtomValue } from "jotai";
import { DateTime } from "luxon";
import { useMemo } from "react";
import { PlatformColor, Pressable, useWindowDimensions, View } from "react-native";
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle } from "react-native-reanimated";
import GenericIcon from "../icon";
import CustomText from "../text/CustomText";
import { Host, Text } from "@expo/ui/swift-ui";
import { MotiView } from "moti";

// ✅ 

type TPlannerDateIconProps = {
    datestamp: string;
    scrollX: SharedValue<number>;
    isScrolling: boolean;
    index: number;
    onPress: () => void;
};

const DAY_OF_WEEK_SIZE = 9;

const PlannerDateIcon = ({ datestamp, scrollX, isScrolling, index, onPress }: TPlannerDateIconProps) => {
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    const currentDatestamp = useAtomValue(currentPlannerDatestamp);

    const { background } = useAppTheme();

    const { month, day, dayOfWeek } = useMemo(() => {
        const date = DateTime.fromISO(datestamp);
        return {
            month: date.toFormat('MMM').toUpperCase(),
            day: date.toFormat('d').toUpperCase(),
            dayOfWeek: date.toFormat('ccc').toUpperCase()
        }
    }, [datestamp]);

    const isCurrentDatestamp = datestamp === currentDatestamp;
    const focusedScrollX = index * PLANNER_CAROUSEL_ITEM_WIDTH;

    const animatedContainerStyle = useAnimatedStyle(() => {
        const distance = Math.abs(scrollX.value - focusedScrollX);
        const ranges = [0, SCREEN_WIDTH * 0.7, SCREEN_WIDTH * .9, SCREEN_WIDTH];

        const scale = interpolate(
            distance,
            ranges,
            [1, 0.6, 0.2, 0],
            Extrapolation.CLAMP
        );

        const opacity = interpolate(
            distance,
            ranges,
            [1, 0.6, 0.2, 0],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ scale }],
            opacity,
        };
    });

    return (
        <Animated.View style={[{
            width: PLANNER_CAROUSEL_ICON_WIDTH, 
            height: PLANNER_CAROUSEL_ICON_WIDTH + DAY_OF_WEEK_SIZE
        }, animatedContainerStyle]}>
            <Pressable
                onPress={onPress}
                className='relative'
            >

                {/* Note Icon */}
                <GenericIcon
                    type='note'
                    size='xl'
                    hideRipple
                    platformColor={isCurrentDatestamp ? 'systemBlue' : 'tertiaryLabel'}
                />

                {/* Date Info */}
                <View className='absolute w-full h-full'>
                    <View className='w-full items-center mt-[0.3rem]'>
                        <CustomText variant='todayMonth' customStyle={{ color: PlatformColor(background) }}>
                            {month}
                        </CustomText>
                    </View>
                    <View className='w-full items-center'>
                        <CustomText
                            variant='todayDate'
                            customStyle={{
                                color: PlatformColor(isCurrentDatestamp ? 'label' : 'tertiaryLabel'),
                            }}
                        >
                            {day}
                        </CustomText>
                    </View>
                </View>

                {/* Day of Week Indicator */}
                <MotiView
                    animate={{ opacity: isScrolling ? 1 : 0 }}
                    className='absolute w-full top-full'
                >
                    <Host style={{ width: '100%' }}>
                        <Text
                            design='rounded'
                            size={DAY_OF_WEEK_SIZE}
                            color={PlatformColor('secondaryLabel') as unknown as string}
                            weight="bold"
                        >
                            {dayOfWeek}
                        </Text>
                    </Host>
                </MotiView>

            </Pressable>
        </Animated.View>
    )
}

export default PlannerDateIcon;