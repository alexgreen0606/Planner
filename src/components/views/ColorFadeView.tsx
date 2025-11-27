import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useMemo, useState } from 'react';
import { ColorValue, LayoutChangeEvent, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';

interface IColorFadeViewProps extends ViewProps {
  colors: readonly [ColorValue, ColorValue, ...ColorValue[]];
  totalHeight: number;
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
  }, [totalHeight, solidHeight]);

  function handleLayout(event: LayoutChangeEvent) {
    if (totalHeight === undefined) {
      const { height } = event.nativeEvent.layout;
      setMeasuredHeight(height);
    }
    onLayoutProp?.(event);
  }

  const blurLayers = useMemo(() => {
    const layers = [];
    const blurCount = 10;
    const remainingHeight = Math.max(0, effectiveHeight - solidHeight);
    const step = remainingHeight / blurCount;


    for (let i = 0; i < blurCount; i++) {
      const layerHeight = solidHeight + step * (i + 1);
      layers.push(
        <BlurView
          key={i}
          intensity={2}
          tint="default"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: layerHeight,
          }}
        />
      );
    }
    return layers;
  }, [effectiveHeight, solidHeight]);

  return (
    <MotiView
      animate={{ height: totalHeight }}
      className='w-full'
    >
      <LinearGradient
        {...restProps}
        colors={colors}
        locations={locations}
        style={[
          {
            flex: 1
          },
          style
        ]}
        onLayout={handleLayout}
      />
      {blurLayers}
    </MotiView>
  );
};

export default ColorFadeView;
