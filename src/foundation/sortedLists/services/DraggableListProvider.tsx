import { useGestureHandlerRef } from '@react-navigation/stack';
import React, { createContext, useContext, useRef } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    useAnimatedGestureHandler,
} from 'react-native-reanimated';

interface DraggableContextValue {
    // panResponder: PanResponderInstance;
    scroll: (distance: number) => void;
    // scrollDisplace: (newPosition: number) => void;
    beginClickingItem: () => void;
    endClickingItem: () => void;
}

const DraggableListContext = createContext<DraggableContextValue | null>(null);

export const DraggableListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const clickingItem = useRef(false);
    const scrollPosition = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            if (!clickingItem.current)
                scrollPosition.value = event.contentOffset.y;

            console.log(scrollPosition.value)
        },
        onBeginDrag: (e) => {
        },
        onEndDrag: (e) => {

        },
    });

    const scroll = (distance: number) => {
        scrollPosition.value += distance;
    }

    // const panResponder = useRef(
    //     PanResponder.create({
    //         onStartShouldSetPanResponder: () => !clickingItem.current,
    //         onMoveShouldSetPanResponder: (_, gestureState) => {
    //             return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
    //         },
    //         onPanResponderMove: (_, gestureState) => { // scrolling occurs
    //             // Scroll the container
    //             if (!clickingItem.current && scrollViewRef.current) {
    //                 console.log('Scrolling within the parent.')
    //                 scrollViewRef.current.scrollTo({
    //                     x: 0,
    //                     y: scrollPosition.value - gestureState.dy,
    //                     animated: true,
    //                 });
    //                 // scrollPosition.value -= gestureState.dy;
    //                 // scrollViewRef.current.scrollTo({
    //                 //     x: 0,
    //                 //     y: scrollPosition.current - gestureState.dy,
    //                 //     animated: false,
    //                 // });
    //             }
    //         },
    //         // onPanResponderRelease: (_, gestureState) => {
    //         //     scrollPosition.current = scrollPosition.current - gestureState.dy;

    //         //     // Smooth deceleration
    //         //     const { vy } = gestureState; // Vertical velocity
    //         //     const decelerationRate = 0.95;
    //         //     let currentVelocity = vy;
    //         //     let frameCount = 0;
    //         //     const animateDeceleration = () => {
    //         //         if (Math.abs(currentVelocity) > 0.1) {
    //         //             if (scrollViewRef.current) {
    //         //                 scrollPosition.current -= currentVelocity;
    //         //                 scrollViewRef.current.scrollTo({
    //         //                     x: 0,
    //         //                     y: scrollPosition.current,
    //         //                     animated: false,
    //         //                 });
    //         //             }
    //         //             currentVelocity *= decelerationRate;
    //         //             frameCount++;
    //         //             requestAnimationFrame(animateDeceleration);
    //         //         }
    //         //     };

    //         //     animateDeceleration();
    //         // },
    //         onPanResponderRelease: (_, gestureState) => {
    //             const velocity = -gestureState.vy * 1000; // Adjust velocity to match pixels per second
    //             scrollPosition.value = withDecay({
    //                 velocity,
    //                 deceleration: 0.998, // Adjust for a smooth deceleration
    //             });
    //         },
    //         // onPanResponderTerminate: (_, gestureState) => {
    //         //     scrollPosition.current = scrollPosition.current - gestureState.dy;
    //         // },
    //     })
    // ).current;

    // const scrollDisplace = (newPosition: number) => {
    //     if (!scrollViewRef.current) return;
    //     scrollViewRef.current.scrollTo({
    //         x: 0,
    //         y: scrollPosition.current - newPosition,
    //         animated: false,
    //     });
    // }

    // const setScrollPosition = (newPosition: number) => {
    //     scrollPosition.current = scrollPosition.current - newPosition;
    // };

    // const animatedStyle = useAnimatedStyle(() => ({
    //     transform: [{ translateY: -scrollPosition.value }],
    // }));

    const beginClickingItem = () => {
        console.log('Item clicked -> all scrolling handled by list.')
        clickingItem.current = true;
    };

    const endClickingItem = () => {
        console.log('Item unclicked -> all scrolling now managed by scroll view itself.')
        clickingItem.current = false;
    };

    return (
        <DraggableListContext.Provider
            value={{
                beginClickingItem,
                endClickingItem,
                scroll
            }}>
            {/* <Animated.ScrollView
                ref={scrollViewRef}
                scrollEnabled={false}
                {...panResponder.panHandlers}
                centerContent
            > */}
            <Animated.ScrollView
                style={{ width: '100%', height: '100%' }}
                onScroll={scrollHandler}
                scrollEnabled={!clickingItem.current}
            >
                {children}
            </Animated.ScrollView>
            {/* </Animated.ScrollView> */}
        </DraggableListContext.Provider>
    );
};

export const useDraggableListContext = () => {
    const context = useContext(DraggableListContext);
    if (!context) {
        throw new Error("useDraggableList must be used within a Provider");
    }

    return context;
};
