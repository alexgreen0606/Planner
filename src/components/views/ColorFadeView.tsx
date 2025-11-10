import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { ColorValue, LayoutChangeEvent, ViewProps } from 'react-native';

interface IColorFadeViewProps extends ViewProps {
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
}: IColorFadeViewProps) => {
  const [measuredHeight, setMeasuredHeight] = useState<number>(0);

  const effectiveHeight = totalHeight ?? measuredHeight;
  const locations: readonly [number, number, ...number[]] = useMemo(() => {
    if (colors.length === 2) {
      // Simple 2-color fade: [0, 1]
      return [0, 1];
    }

    if (effectiveHeight === 0) {
      return [0, 0, 1];
    }

    // If solidHeight >= effectiveHeight, fallback to 0 for middle location.
    const solidRatio = solidHeight / effectiveHeight;
    if (solidRatio >= 1) {
      return [0, 0, 1];
    }

    return [0, solidRatio, 1];
  }, []);

  function handleLayout(event: LayoutChangeEvent) {
    if (totalHeight === undefined) {
      const { height } = event.nativeEvent.layout;
      setMeasuredHeight(height);
    }
    onLayoutProp?.(event);
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
