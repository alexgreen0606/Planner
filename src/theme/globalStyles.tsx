import { TextStyle, ViewStyle } from "react-native";
import { theme } from "./theme";

type GlobalStyles = {
  spacedApart: ViewStyle;
  backdrop: ViewStyle;
  background: ViewStyle;
  listItem: TextStyle;
  verticallyCentered: ViewStyle;
  listRow: ViewStyle;
  fullWidth: ViewStyle;
}

const globalStyles: GlobalStyles = {
  spacedApart: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%'
  },
  backdrop: {
    backgroundColor: theme.colors.backdrop
  },
  background: {
    backgroundColor: theme.colors.background
  },
  listItem: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 4,
    paddingBottom: 4,
    minHeight: 25,
    color: theme.colors.secondary,
    fontSize: 16,
  },
  verticallyCentered: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8
  },
  fullWidth: {
    width: '100%'
  }
};

export default globalStyles;
