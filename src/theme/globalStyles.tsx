import { HEADER_HEIGHT } from "@/constants/layout";
import { PlatformColor, ViewStyle } from "react-native";

type GlobalStyles = {
  verticallyCentered: ViewStyle;
  blackFilledSpace: ViewStyle;
  pageLabelContainer: ViewStyle;
}

const globalStyles: GlobalStyles = {
  blackFilledSpace: {
    flex: 1,
    backgroundColor: PlatformColor('systemBackground')
  },
  verticallyCentered: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  pageLabelContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
    height: HEADER_HEIGHT,
    position: 'relative'
  }
};

export default globalStyles;