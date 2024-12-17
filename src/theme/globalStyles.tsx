import { ViewStyle } from "react-native";

type GlobalStyles = {
    spacedApart: ViewStyle;
}

const globalStyles: GlobalStyles = {
  spacedApart: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%'
  },
};

export default globalStyles;
