import { currentPlannerDatestamp } from "@/atoms/currentPlannerDatestamp";
import { SCROLL_THROTTLE } from "@/lib/constants/listConstants";
import { PLANNER_BANNER_PADDING, PLANNER_CAROUSEL_ICON_WIDTH, PLANNER_CAROUSEL_ITEM_WIDTH } from "@/lib/constants/miscLayout";
import { getDatestampRange, getDayShiftedDatestamp } from "@/utils/dateUtils";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, { scrollTo, useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { runOnJS, runOnUI } from "react-native-worklets";
import OpenCalendarIconButton from "../icon/custom/OpenCalendarIconButton";
import PlannerDateIcon from "./PlannerDateIcon";

// ✅ 

const SCROLL_RANGE_SIZE = 15;
const MIDDLE_SCROLL_X = PLANNER_CAROUSEL_ITEM_WIDTH * SCROLL_RANGE_SIZE;

const PlannerCarousel = () => {
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    const [currentDatestamp, setCurrentDatestamp] = useAtom(currentPlannerDatestamp);

    const scrollRef = useAnimatedRef<Animated.FlatList>();

    const [isScrolling, setIsScrolling] = useState(false);
    const [datestampOptions, setDatestampOptions] = useState(getDatestampRange(
        getDayShiftedDatestamp(currentDatestamp, -SCROLL_RANGE_SIZE),
        getDayShiftedDatestamp(currentDatestamp, SCROLL_RANGE_SIZE)
    ));

    const scrollX = useSharedValue(MIDDLE_SCROLL_X);
    const isSnappingToDatestamp = useSharedValue(false);

    const scrollHandler = useAnimatedScrollHandler({
        onBeginDrag: () => {
            runOnJS(setIsScrolling)(true);
        },
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
        onEndDrag: (event) => {
            runOnJS(setIsScrolling)(false);

            if (isSnappingToDatestamp.value) {
                isSnappingToDatestamp.value = false;
                return;
            }

            if (event.velocity && event.velocity.x === 0) {
                const snappedIndex = Math.round(scrollX.value / PLANNER_CAROUSEL_ITEM_WIDTH);
                runOnJS(syncDatestampWithScrollPosition)(snappedIndex);
            }
        },
        onMomentumEnd: () => {
            if (isSnappingToDatestamp.value) {
                isSnappingToDatestamp.value = false;
                return;
            }

            const snappedIndex = Math.round(scrollX.value / PLANNER_CAROUSEL_ITEM_WIDTH);
            runOnJS(syncDatestampWithScrollPosition)(snappedIndex);
        },
    });

    function syncDatestampWithScrollPosition(newDatestampIndex: number) {
        const newDatestamp = datestampOptions[newDatestampIndex];
        if (!newDatestamp) return;

        setCurrentDatestamp(newDatestamp);
    }

    function scrollToDatestamp(newDatestamp: string) {
        const index = datestampOptions.indexOf(newDatestamp);
        if (index !== -1) {
            runOnUI(scrollToWorklet)(index * PLANNER_CAROUSEL_ITEM_WIDTH, true);
        }
    }

    function scrollToWorklet(newScrollX: number, animated: boolean) {
        'worklet';

        if (!animated) {
            isSnappingToDatestamp.value = true;
        }

        scrollTo(scrollRef, newScrollX, 0, animated);
    }

    // Rebuild the scroll options when the selected datestamp approaches the end of the wheel.
    useEffect(() => {
        const currentDatestampIndex = datestampOptions.indexOf(currentDatestamp);

        if (
            currentDatestampIndex <= 5 ||
            currentDatestampIndex >= datestampOptions.length - 5
        ) {
            setDatestampOptions(getDatestampRange(
                getDayShiftedDatestamp(currentDatestamp, -SCROLL_RANGE_SIZE),
                getDayShiftedDatestamp(currentDatestamp, SCROLL_RANGE_SIZE)
            ));

            runOnUI(scrollToWorklet)(
                MIDDLE_SCROLL_X,
                false
            );
        }
    }, [currentDatestamp]);

    return (
        <View className='flex-row relative'>
            <Animated.FlatList
                data={datestampOptions}
                renderItem={({ item: datestamp, index }) => (
                    <View style={{ width: PLANNER_CAROUSEL_ITEM_WIDTH }}>
                        <PlannerDateIcon
                            datestamp={datestamp}
                            scrollX={scrollX}
                            isScrolling={isScrolling}
                            index={index}
                            onPress={() => scrollToDatestamp(datestamp)}
                        />
                    </View>
                )}
                initialScrollIndex={datestampOptions.indexOf(currentDatestamp)}
                horizontal
                getItemLayout={(_, index) => ({
                    length: PLANNER_CAROUSEL_ITEM_WIDTH,
                    offset: PLANNER_CAROUSEL_ITEM_WIDTH * index,
                    index,
                })}
                contentContainerStyle={{
                    paddingRight: SCREEN_WIDTH - PLANNER_CAROUSEL_ITEM_WIDTH - (PLANNER_BANNER_PADDING * 2),
                }}
                bounces={false}
                showsHorizontalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={SCROLL_THROTTLE}
                snapToInterval={PLANNER_CAROUSEL_ITEM_WIDTH}
                snapToAlignment="start"
                ref={scrollRef}
            />
            <View className='absolute right-0 justify-center' style={{ height: PLANNER_CAROUSEL_ICON_WIDTH }}>
                <OpenCalendarIconButton onPress={() => console.log('Open Calendar')} />
            </View>
        </View>
    )
};

export default PlannerCarousel;