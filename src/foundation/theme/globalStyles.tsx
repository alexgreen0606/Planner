import { StyleSheet, ViewStyle } from "react-native";
import colors from "./colors";

type GlobalStyles = {
  spacedApart: ViewStyle;
  verticallyCentered: ViewStyle;
  blackFilledSpace: ViewStyle;
  pageLabelContainer: ViewStyle;
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
  pageLabelContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 8,
    borderBottomColor: colors.grey,
        borderBottomWidth: StyleSheet.hairlineWidth,
        paddingBottom: 7.5
  }
};

export default globalStyles;