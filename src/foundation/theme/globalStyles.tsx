import { StyleSheet, ViewStyle } from "react-native";
import Colors from "./colors";

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
    backgroundColor: Colors.BLACK
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
    borderBottomColor: Colors.GREY,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 7.5
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