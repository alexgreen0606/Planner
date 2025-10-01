import useAppTheme from "@/hooks/useAppTheme";
import { PLANNER_CAROUSEL_DAY_OF_WEEK_FONT_SIZE, PLANNER_CAROUSEL_HEIGHT, PLANNER_CAROUSEL_ICON_WIDTH } from "@/lib/constants/miscLayout";
import { Host, Text } from "@expo/ui/swift-ui";
import { DateTime } from "luxon";
import { MotiView } from "moti";
import { useMemo } from "react";
import { PlatformColor, Pressable, useWindowDimensions, View } from "react-native";
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle } from "react-native-reanimated";
import GenericIcon from "../icon";
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

const PlannerDateIcon = ({ datestamp, scrollX, isCurrentDatestamp, isScrolling, index, onPress }: TPlannerDateIconProps) => {
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    const { background } = useAppTheme();

    const { month, day, dayOfWeek } = useMemo(() => {
        const date = DateTime.fromISO(datestamp);
        return {
            month: date.toFormat('MMM').toUpperCase(),
            day: date.toFormat('d').toUpperCase(),
            dayOfWeek: date.toFormat('ccc').toUpperCase()
        }
    }, [datestamp]);

    const PLANNER_CAROUSEL_ITEM_WIDTH = SCREEN_WIDTH / 8;

    const focusedScrollX = index * PLANNER_CAROUSEL_ITEM_WIDTH;

    const animatedContainerStyle = useAnimatedStyle(() => {
        const distance = Math.abs(scrollX.value - focusedScrollX);
        const ranges = [0, SCREEN_WIDTH * (4 / 6), SCREEN_WIDTH * (5 / 6), SCREEN_WIDTH];

        const scale = interpolate(
            distance,
            ranges,
            [1, .5, .2, 0],
            Extrapolation.CLAMP
        );

        const opacity = interpolate(
            distance,
            ranges,
            [1, .5, .2, 0],
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
                    platformColor={isCurrentDatestamp ? 'systemBlue' : 'secondaryLabel'}
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
                                color: PlatformColor(isCurrentDatestamp ? 'label' : 'secondaryLabel')
                            }}
                        >
                            {day}
                        </CustomText>
                    </View>
                </View>

                {/* Day of Week Indicator */}
                <MotiView
                    animate={{ opacity: isScrolling ? 1 : 0 }}
                    className='absolute w-full bottom-full'
                >
                    <Host style={{ width: '100%' }}>
                        <Text
                            design='rounded'
                            size={PLANNER_CAROUSEL_DAY_OF_WEEK_FONT_SIZE}
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