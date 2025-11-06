import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ColorValue, ViewProps, LayoutChangeEvent } from 'react-native';

// ✅

type TColorFadeViewProps = ViewProps & {
  colors: readonly [ColorValue, ColorValue, ...ColorValue[]];
  totalHeight?: number;
  solidHeight?: number;
};

const ColorFadeView = ({
  colors,
  totalHeight,
  solidHeight = 0,
  style,
  onLayout: onLayoutProp,
  ...restProps
}: TColorFadeViewProps) => {
  const [measuredHeight, setMeasuredHeight] = useState<number>(0);

  const effectiveHeight = totalHeight ?? measuredHeight;
  const locations = computeLocations();

  function handleLayout(event: LayoutChangeEvent) {
    if (totalHeight === undefined) {
      const { height } = event.nativeEvent.layout;
      setMeasuredHeight(height);
    }
    onLayoutProp?.(event);
  }

  function computeLocations(): readonly [number, number, ...number[]] {
    if (colors.length === 2) {
      // Simple 2-color fade: [0, 1]
      return [0, 1];
    }

    if (effectiveHeight === 0) {
      return [0, 0, 1];
    }

    const solidRatio = solidHeight / effectiveHeight;

    // If solidHeight >= effectiveHeight, fallback to 0 for middle location.
    if (solidRatio >= 1) {
      return [0, 0, 1];
    }

    return [0, solidRatio, 1];
  }

  return (
    <LinearGradient
      {...restProps}
      colors={colors}
      locations={locations}
      style={[
        {
          width: '100%',
          ...(totalHeight !== undefined && { height: totalHeight })
        },
        style
      ]}
      onLayout={handleLayout}
    />
  );
};

export default ColorFadeView;
