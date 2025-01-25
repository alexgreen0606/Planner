import { ViewStyle } from "react-native";
import colors from "./colors";

type GlobalStyles = {
  spacedApart: ViewStyle;
  verticallyCentered: ViewStyle;
  blackFilledSpace: ViewStyle;
}

const globalStyles: GlobalStyles = {
  spacedApart: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%'
  },
  blackFilledSpace: {
    flex: 1,
    backgroundColor: colors.black
  },
  verticallyCentered: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
};

export default globalStyles;