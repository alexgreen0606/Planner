import { ViewProps } from 'react-native';
import Animated, { FadeIn, FadeOut, FadingTransition } from 'react-native-reanimated';

const FadeTransitionView = (props: ViewProps) => (
  <Animated.View entering={FadeIn} layout={FadingTransition} exiting={FadeOut} {...props} />
);

export default FadeTransitionView;
