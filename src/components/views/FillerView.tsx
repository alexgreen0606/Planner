import { View, ViewProps } from 'react-native'

const FillerView = (props: ViewProps) => (
  <View className="pointer-events-none opacity-0" {...props} />
)

export default FillerView
