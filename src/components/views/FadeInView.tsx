import { ViewProps } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// ✅

const FadeInView = (props: ViewProps) => (
  <Animated.View entering={FadeIn} exiting={FadeOut} {...props} />
);

export default FadeInView;
