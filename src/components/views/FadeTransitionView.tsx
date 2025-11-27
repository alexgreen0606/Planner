import { ViewProps } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const FadeTransitionView = (props: ViewProps) => (
  <Animated.View entering={FadeIn} exiting={FadeOut} {...props} />
);

export default FadeTransitionView;
