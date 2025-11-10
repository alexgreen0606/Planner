import { View } from 'react-native';

import PlannerDateIcon from './PlannerDateIcon';

type TPlannerCarouselWeekProps = {
  datestamps: string[];
  currentDatestamp: string;
};

const PlannerCarouselWeek = ({ datestamps, currentDatestamp }: TPlannerCarouselWeekProps) => (
  <View className="flex-row justify-evenly">
    {datestamps.map((datestamp) => (
      <PlannerDateIcon
        datestamp={datestamp}
        isCurrentDatestamp={datestamp === currentDatestamp}
        key={`${datestamp}-icon`}
      />
    ))}
  </View>
);

export default PlannerCarouselWeek;
