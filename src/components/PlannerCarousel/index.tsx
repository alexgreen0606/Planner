import useAppTheme from "@/hooks/useAppTheme";
import { SCROLL_THROTTLE } from "@/lib/constants/listConstants";
import { PLANNER_BANNER_PADDING } from "@/lib/constants/miscLayout";
import { TPlannerPageParams } from "@/lib/types/routeParams/TPlannerPageParams";
import { getDatestampRange, getDayShiftedDatestamp } from "@/utils/dateUtils";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, { scrollTo, useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { runOnJS, runOnUI } from "react-native-worklets";
import OpenCalendarButton from "../icons/customButtons/OpenCalendarIconButton";
import PlannerDateIcon from "./PlannerDateIcon";

// ✅ 

const CAROUSEL_RADIUS = 20;

const PlannerCarousel = ({ datestamp: currentDatestamp }: TPlannerPageParams) => {
    const router = useRouter();
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    const scrollRef = useAnimatedRef<Animated.FlatList>();

    const [isScrolling, setIsScrolling] = useState(false);
    const [datestampOptions, setDatestampOptions] = useState(currentDatestamp ? getDatestampRange(
        getDayShiftedDatestamp(currentDatestamp, -CAROUSEL_RADIUS),
        getDayShiftedDatestamp(currentDatestamp, CAROUSEL_RADIUS)
    ) : []);

    const PLANNER_CAROUSEL_ITEM_WIDTH = SCREEN_WIDTH / 8;
    const CAROUSEL_CENTER_SCROLL_X = PLANNER_CAROUSEL_ITEM_WIDTH * CAROUSEL_RADIUS;

    const scrollX = useSharedValue(CAROUSEL_CENTER_SCROLL_X);
    const isSnappingToCenter = useSharedValue(false);

    const { background } = useAppTheme();

    const scrollHandler = useAnimatedScrollHandler({
        onBeginDrag: () => {
            runOnJS(setIsScrolling)(true);
        },
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
        onEndDrag: (event) => {
            if (event.velocity && event.velocity.x === 0) {
                runOnJS(setIsScrolling)(false);
                const snappedIndex = Math.round(scrollX.value / PLANNER_CAROUSEL_ITEM_WIDTH);
                runOnJS(syncDatestampWithScrollPosition)(snappedIndex);
            }
        },
        onMomentumEnd: () => {
            if (isSnappingToCenter.value) {
                isSnappingToCenter.value = false;
                return;
            }

            runOnJS(setIsScrolling)(false);
            const snappedIndex = Math.round(scrollX.value / PLANNER_CAROUSEL_ITEM_WIDTH);
            runOnJS(syncDatestampWithScrollPosition)(snappedIndex);
        },
    });

    function syncDatestampWithScrollPosition(newDatestampIndex: number) {
        const newDatestamp = datestampOptions[newDatestampIndex];
        if (!newDatestamp) return;

        if (newDatestamp === currentDatestamp) return;

        router.push(`/planners/${newDatestamp}`);
    }

    function scrollToDatestamp(newDatestamp: string) {
        const index = datestampOptions.indexOf(newDatestamp);
        if (index !== -1) {
            runOnUI(scrollWorklet)(index * PLANNER_CAROUSEL_ITEM_WIDTH, true);
        }
    }

    function scrollWorklet(newScrollX: number, animated: boolean) {
        'worklet';
        scrollTo(scrollRef, newScrollX, 0, animated);
    }

    // Rebuild the scroll options when the selected datestamp approaches the end of the wheel.
    useEffect(() => {
        const currentDatestampIndex = datestampOptions.indexOf(currentDatestamp);

        if (
            datestampOptions.length === 0 ||
            currentDatestampIndex <= 8 ||
            currentDatestampIndex >= datestampOptions.length - 8
        ) {
            isSnappingToCenter.value = true;
            runOnUI(scrollWorklet)(
                CAROUSEL_CENTER_SCROLL_X,
                false
            );

            setDatestampOptions(getDatestampRange(
                getDayShiftedDatestamp(currentDatestamp, -CAROUSEL_RADIUS),
                getDayShiftedDatestamp(currentDatestamp, CAROUSEL_RADIUS)
            ));
        }
    }, [currentDatestamp]);

    return (
        <View
            className='flex-row w-full relative z-[1000]'
            style={{ paddingHorizontal: PLANNER_BANNER_PADDING }}
        >

            {/* Scroll Wheel */}
            <Animated.FlatList
                data={datestampOptions}
                renderItem={({ item: datestamp, index }) => (
                    <View style={{ width: PLANNER_CAROUSEL_ITEM_WIDTH, justifyContent: 'flex-end' }}>
                        <PlannerDateIcon
                            isCurrentDatestamp={datestamp === currentDatestamp}
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
                ref={scrollRef}
                initialNumToRender={7}
                maxToRenderPerBatch={7}
                windowSize={3}
                removeClippedSubviews
            />

            {/* Calendar Button */}
            <View className='absolute right-0 justify-center h-full'>
                <OpenCalendarButton onPress={() => console.log('Open Calendar')} />
            </View>

        </View>
    )
};

export default PlannerCarousel;