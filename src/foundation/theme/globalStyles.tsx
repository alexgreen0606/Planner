import { TextStyle, ViewStyle } from "react-native";
import colors from "./colors";

type GlobalStyles = {
  spacedApart: ViewStyle;
  backdrop: ViewStyle;
  background: ViewStyle;
  verticallyCentered: ViewStyle;
  fullWidth: ViewStyle;
  horizontallyCentered: ViewStyle;
}

const globalStyles: GlobalStyles = {
  spacedApart: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%'
  },
  backdrop: {
    backgroundColor: colors.black,
    flex: 1
  },
  background: {
    backgroundColor: colors.background
  },
  verticallyCentered: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontallyCentered: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%'
  }
};

export default globalStyles;