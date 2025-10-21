import useAppTheme from "@/hooks/useAppTheme";
import { SCROLL_THROTTLE } from "@/lib/constants/listConstants";
import { PLANNER_BANNER_PADDING, PLANNER_CAROUSEL_DAY_OF_WEEK_FONT_SIZE, PLANNER_CAROUSEL_ICON_WIDTH } from "@/lib/constants/miscLayout";
import { TPlannerPageParams } from "@/lib/types/routeParams/TPlannerPageParams";
import { getDatestampRange, getDayShiftedDatestamp } from "@/utils/dateUtils";
import { useRouter } from "expo-router";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, { scrollTo, useAnimatedReaction, useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { runOnJS, runOnUI } from "react-native-worklets";
import PlannerDateIcon from "./PlannerDateIcon";
import { DateTimePicker, Host } from "@expo/ui/swift-ui";

// ✅ 

const CAROUSEL_RADIUS = 20;

const PlannerCarousel = ({ datestamp: currentDatestamp }: TPlannerPageParams) => {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const router = useRouter();

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
    const isDragging = useSharedValue(false);
    const isScrollingAnim = useSharedValue(false);
    const isMomentumScrolling = useSharedValue(false);
    const isSnappingToCenter = useSharedValue(false);

    const scrollHandler = useAnimatedScrollHandler({
        onBeginDrag: () => {
            isDragging.value = true;
            runOnJS(setIsScrolling)(true);
        },
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
            isScrollingAnim.value = true;
        },
        onEndDrag: (event) => {
            isDragging.value = false;
            if (event.velocity && event.velocity.x !== 0) {
                isMomentumScrolling.value = true;
            } else {
                runOnJS(setIsScrolling)(false);
                isScrollingAnim.value = false;
            }
        },
        onMomentumEnd: () => {
            isScrollingAnim.value = false;
            isMomentumScrolling.value = false;
            runOnJS(setIsScrolling)(false);
        },
    });

    // Rebuild the options when the edge of the carousel has been reached.
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
        }
    }, [currentDatestamp]);

    // Watch scroll offset and update datestamp when carousel becomes idle.
    useAnimatedReaction(
        () => ({
            scrollX: scrollX.value,
            isDragging: isDragging.value,
            isMomentum: isMomentumScrolling.value,
            isScrollingAn: isScrollingAnim.value
        }),
        (current, previous) => {
            const wasMoving = previous?.isDragging || previous?.isMomentum || previous?.isScrollingAn;
            const isNowIdle = !current.isDragging && !current.isMomentum && !current.isScrollingAn;

            if (wasMoving && isNowIdle) {
                const snappedIndex = Math.round(current.scrollX / PLANNER_CAROUSEL_ITEM_WIDTH);
                runOnJS(handleOpenPlanner)(snappedIndex);
            }
        }
    );

    // Takes in an index, Date, or datestamp.
    function handleOpenPlanner(target: Date | string | number) {
        const isDatestamp = typeof (target) === 'string';
        const isIndex = typeof (target) === 'number';

        let datestamp =
            isDatestamp ? target :
                isIndex ? datestampOptions[target] :
                    DateTime.fromJSDate(target).toISODate()!;

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

    return (
        <View
            className='w-full relative'
            style={{ paddingHorizontal: PLANNER_BANNER_PADDING }}
        >

            {/* Date Picker */}
            <View
                className="absolute z-[0] top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ translateY: PLANNER_CAROUSEL_DAY_OF_WEEK_FONT_SIZE }}
            >
                <Host matchContents>
                    <DateTimePicker
                        onDateSelected={(date) => handleOpenPlanner(date)}
                        displayedComponents="date"
                        initialDate={currentDatestamp}
                        variant="automatic"
                    />
                </Host>
            </View>

            {/* Scroll Wheel */}
            <Animated.FlatList
                data={datestampOptions}
                renderItem={({ item: datestamp, index }) => {
                    const isCurrentDatestamp = datestamp === currentDatestamp;

                    return (
                        <View
                            pointerEvents={isCurrentDatestamp ? 'none' : 'auto'}
                            className='z-[4] items-center'
                            style={{
                                backgroundColor: background,
                                width: PLANNER_CAROUSEL_ITEM_WIDTH
                            }}
                        >
                            <PlannerDateIcon
                                isCurrentDatestamp={isCurrentDatestamp}
                                datestamp={datestamp}
                                scrollX={scrollX}
                                isScrolling={isScrolling}
                                index={index}
                                onPress={() => handleScrollToIndex(index)}
                            />
                        </View>
                    );
                }}
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
                    backgroundColor: background,
                    zIndex: 1
                }}
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