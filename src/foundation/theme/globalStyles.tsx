import { StyleSheet, ViewStyle } from "react-native";
import { Palette } from "./colors";

type GlobalStyles = {
  spacedApart: ViewStyle;
  verticallyCentered: ViewStyle;
  blackFilledSpace: ViewStyle;
  pageLabelContainer: ViewStyle;
  centered: ViewStyle;
  fullWidth: ViewStyle;
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
    backgroundColor: Palette.BLACK
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
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  fullWidth: {
    width: '100%'
  }
};

export default globalStyles;