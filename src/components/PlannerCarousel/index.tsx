import { SCROLL_THROTTLE } from "@/lib/constants/listConstants";
import { PLANNER_BANNER_PADDING } from "@/lib/constants/miscLayout";
import { TPlannerPageParams } from "@/lib/types/routeParams/TPlannerPageParams";
import { getDatestampRange, getDayShiftedDatestamp } from "@/utils/dateUtils";
import { useRouter } from "expo-router";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, { scrollTo, useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { runOnJS, runOnUI } from "react-native-worklets";
import PlannerDateIcon from "./PlannerDateIcon";
import { DateTimePicker, Host } from "@expo/ui/swift-ui";
import useAppTheme from "@/hooks/useAppTheme";

// ✅ 

const CAROUSEL_RADIUS = 20;

const PlannerCarousel = ({ datestamp: currentDatestamp }: TPlannerPageParams) => {
    const router = useRouter();
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    const { CssColor: { background } } = useAppTheme();

    const scrollRef = useAnimatedRef<Animated.FlatList>();

    const [isScrolling, setIsScrolling] = useState(false);
    const [datestampOptions, setDatestampOptions] = useState(currentDatestamp ? getDatestampRange(
        getDayShiftedDatestamp(currentDatestamp, -CAROUSEL_RADIUS),
        getDayShiftedDatestamp(currentDatestamp, CAROUSEL_RADIUS)
    ) : []);

    const PLANNER_CAROUSEL_ITEM_WIDTH = SCREEN_WIDTH / 8;
    const CONTENT_WIDTH = SCREEN_WIDTH - (PLANNER_BANNER_PADDING * 2);
    const SIDE_PADDING = (CONTENT_WIDTH - PLANNER_CAROUSEL_ITEM_WIDTH) / 2;
    const CAROUSEL_CENTER_SCROLL_X = PLANNER_CAROUSEL_ITEM_WIDTH * CAROUSEL_RADIUS;

    const scrollX = useSharedValue(CAROUSEL_CENTER_SCROLL_X);
    const isSnappingToCenter = useSharedValue(false);

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
                runOnJS(handleOpenPlanner)(snappedIndex);
            }
        },
        onMomentumEnd: () => {
            if (isSnappingToCenter.value) {
                isSnappingToCenter.value = false;
                return;
            }

            runOnJS(setIsScrolling)(false);
            const snappedIndex = Math.round(scrollX.value / PLANNER_CAROUSEL_ITEM_WIDTH);
            runOnJS(handleOpenPlanner)(snappedIndex);
        },
    });

    // Takes in an index, Date, or datestamp.
    function handleOpenPlanner(target: Date | string | number) {
        const isDatestamp = typeof (target) === 'string';
        const isIndex = typeof (target) === 'number';

        let datestamp = isDatestamp ? target : isIndex ? datestampOptions[target] : DateTime.fromJSDate(target).toISODate()!;
        if (!datestamp) return;

        router.push(`/planners/${datestamp}`);
    }

    function handleScrollToIndex(index: number) {
        runOnUI(handleScrollWorklet)(index * PLANNER_CAROUSEL_ITEM_WIDTH, true);
    }

    function handleScrollWorklet(newScrollX: number, animated: boolean) {
        'worklet';
        scrollTo(scrollRef, newScrollX, 0, animated);
    }

    // Synchronize the datestamp with the scroll offset.
    useEffect(() => {
        const currentDatestampIndex = datestampOptions.indexOf(currentDatestamp);

        if (
            datestampOptions.length === 0 ||
            currentDatestampIndex === 0 ||
            currentDatestampIndex === datestampOptions.length - 1
        ) {
            // Datestamp is at the edge of the carousel. Rebuild the scroll items and snap to middle.
            isSnappingToCenter.value = true;
            runOnUI(handleScrollWorklet)(
                CAROUSEL_CENTER_SCROLL_X,
                false
            );

            setDatestampOptions(getDatestampRange(
                getDayShiftedDatestamp(currentDatestamp, -CAROUSEL_RADIUS),
                getDayShiftedDatestamp(currentDatestamp, CAROUSEL_RADIUS)
            ));
            return;
        }

        // Exit if the datestamp is centered.
        if (scrollX.value === currentDatestampIndex * PLANNER_CAROUSEL_ITEM_WIDTH) return;

        // Scroll to the datestamp icon.
        handleScrollToIndex(currentDatestampIndex);

    }, [currentDatestamp]);

    return (
        <View
            className='w-full relative'
            style={{ paddingHorizontal: PLANNER_BANNER_PADDING }}
        >

            {/* Date Picker */}
            <View
                className="absolute items-center justify-center h-full w-full"
                style={{
                    left: PLANNER_BANNER_PADDING + SIDE_PADDING,
                    width: PLANNER_CAROUSEL_ITEM_WIDTH,
                }}
            >
                <Host matchContents>
                    <DateTimePicker
                        onDateSelected={handleOpenPlanner}
                        displayedComponents='date'
                        initialDate={currentDatestamp}
                        variant='automatic'
                    />
                </Host>
            </View>

            {/* Scroll Wheel */}
            <Animated.FlatList
                data={datestampOptions}
                renderItem={({ item: datestamp, index }) => (
                    <View
                        pointerEvents={datestamp === currentDatestamp ? 'none' : 'auto'}
                        className="items-center"
                        style={{ width: PLANNER_CAROUSEL_ITEM_WIDTH }}
                    >
                        <PlannerDateIcon
                            isCurrentDatestamp={datestamp === currentDatestamp}
                            datestamp={datestamp}
                            scrollX={scrollX}
                            isScrolling={isScrolling}
                            index={index}
                            onPress={() => handleOpenPlanner(datestamp)}
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
                    paddingLeft: SIDE_PADDING,
                    paddingRight: SIDE_PADDING,
                    backgroundColor: background
                }}
                style={{ pointerEvents: 'none' }}
                bounces={false}
                showsHorizontalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={SCROLL_THROTTLE}
                snapToInterval={PLANNER_CAROUSEL_ITEM_WIDTH}
                ref={scrollRef}
                initialNumToRender={9}
                maxToRenderPerBatch={9}
                windowSize={5}
                removeClippedSubviews
            />

        </View>
    )
};

export default PlannerCarousel;