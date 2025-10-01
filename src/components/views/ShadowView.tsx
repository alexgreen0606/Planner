import useAppTheme from '@/hooks/useAppTheme';
import React, { useState, useCallback } from 'react';
import { View, ViewProps, LayoutChangeEvent, StyleSheet, PlatformColor } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';

type TShadowViewProps = ViewProps & {
    edgeSize?: number | TEdgeSize;
    maxOpacity?: number;
};

type TEdgeSize = {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
};

const ShadowView = ({
    children,
    style,
    edgeSize = 32,
    maxOpacity = 0.8,
    ...props
}: TShadowViewProps) => {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const { shadowColor } = useAppTheme();

    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setDimensions({ width, height });
    }, []);

    // Normalize edgeSize to individual values
    const edges = typeof edgeSize === 'number'
        ? { top: edgeSize, right: edgeSize, bottom: edgeSize, left: edgeSize }
        : {
            top: edgeSize.top ?? 32,
            right: edgeSize.right ?? 32,
            bottom: edgeSize.bottom ?? 32,
            left: edgeSize.left ?? 32,
        };

    const { width, height } = dimensions;
    const totalWidth = width + edges.left + edges.right;
    const totalHeight = height + edges.top + edges.bottom;

    return (
        <View style={[styles.container, style]} {...props}>
            {/* SVG gradient layer */}
            {width > 0 && height > 0 && (
                <View style={[styles.gradientContainer, {
                    width: totalWidth,
                    height: totalHeight,
                    top: -edges.top,
                    left: -edges.left,
                }]}>
                    <Svg width={totalWidth} height={totalHeight} style={StyleSheet.absoluteFillObject}>
                        <Defs>
                            {/* Corner radial gradients */}
                            <RadialGradient id="topLeftCorner" cx="1" cy="1" r="1">
                                <Stop offset="0" stopColor={shadowColor} stopOpacity={maxOpacity} />
                                <Stop offset="1" stopColor={shadowColor} stopOpacity="0" />
                            </RadialGradient>

                            <RadialGradient id="topRightCorner" cx="0" cy="1" r="1">
                                <Stop offset="0" stopColor={shadowColor} stopOpacity={maxOpacity} />
                                <Stop offset="1" stopColor={shadowColor} stopOpacity="0" />
                            </RadialGradient>

                            <RadialGradient id="bottomLeftCorner" cx="1" cy="0" r="1">
                                <Stop offset="0" stopColor={shadowColor} stopOpacity={maxOpacity} />
                                <Stop offset="1" stopColor={shadowColor} stopOpacity="0" />
                            </RadialGradient>

                            <RadialGradient id="bottomRightCorner" cx="0" cy="0" r="1">
                                <Stop offset="0" stopColor={shadowColor} stopOpacity={maxOpacity} />
                                <Stop offset="1" stopColor={shadowColor} stopOpacity="0" />
                            </RadialGradient>

                            {/* Edge linear gradients */}
                            <SvgLinearGradient id="topEdge" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor={shadowColor} stopOpacity="0" />
                                <Stop offset="1" stopColor={shadowColor} stopOpacity={maxOpacity} />
                            </SvgLinearGradient>

                            <SvgLinearGradient id="rightEdge" x1="1" y1="0" x2="0" y2="0">
                                <Stop offset="0" stopColor={shadowColor} stopOpacity="0" />
                                <Stop offset="1" stopColor={shadowColor} stopOpacity={maxOpacity} />
                            </SvgLinearGradient>

                            <SvgLinearGradient id="bottomEdge" x1="0" y1="1" x2="0" y2="0">
                                <Stop offset="0" stopColor={shadowColor} stopOpacity="0" />
                                <Stop offset="1" stopColor={shadowColor} stopOpacity={maxOpacity} />
                            </SvgLinearGradient>

                            <SvgLinearGradient id="leftEdge" x1="0" y1="0" x2="1" y2="0">
                                <Stop offset="0" stopColor={shadowColor} stopOpacity="0" />
                                <Stop offset="1" stopColor={shadowColor} stopOpacity={maxOpacity} />
                            </SvgLinearGradient>
                        </Defs>

                        {/* Top-left corner */}
                        <Rect
                            x={0}
                            y={0}
                            width={edges.left}
                            height={edges.top}
                            fill="url(#topLeftCorner)"
                        />

                        {/* Top edge */}
                        <Rect
                            x={edges.left}
                            y={0}
                            width={width}
                            height={edges.top}
                            fill="url(#topEdge)"
                        />

                        {/* Top-right corner */}
                        <Rect
                            x={edges.left + width}
                            y={0}
                            width={edges.right}
                            height={edges.top}
                            fill="url(#topRightCorner)"
                        />

                        {/* Left edge */}
                        <Rect
                            x={0}
                            y={edges.top}
                            width={edges.left}
                            height={height}
                            fill="url(#leftEdge)"
                        />

                        {/* Center (solid) */}
                        <Rect
                            x={edges.left}
                            y={edges.top}
                            width={width}
                            height={height}
                            fill={shadowColor}
                            fillOpacity={maxOpacity}
                        />

                        {/* Right edge */}
                        <Rect
                            x={edges.left + width}
                            y={edges.top}
                            width={edges.right}
                            height={height}
                            fill="url(#rightEdge)"
                        />

                        {/* Bottom-left corner */}
                        <Rect
                            x={0}
                            y={edges.top + height}
                            width={edges.left}
                            height={edges.bottom}
                            fill="url(#bottomLeftCorner)"
                        />

                        {/* Bottom edge */}
                        <Rect
                            x={edges.left}
                            y={edges.top + height}
                            width={width}
                            height={edges.bottom}
                            fill="url(#bottomEdge)"
                        />

                        {/* Bottom-right corner */}
                        <Rect
                            x={edges.left + width}
                            y={edges.top + height}
                            width={edges.right}
                            height={edges.bottom}
                            fill="url(#bottomRightCorner)"
                        />
                    </Svg>
                </View>
            )}

            {/* Children content layer */}
            <View onLayout={handleLayout} style={styles.childrenContainer}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        alignSelf: 'flex-start',
    },
    gradientContainer: {
        position: 'absolute',
    },
    childrenContainer: {
        zIndex: 1,
    },
});

export default ShadowView;