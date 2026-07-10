import { Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

type Props = {
  color: string;
  data: number[];
};

export default function DashboardLineChart({
  color,
  data,
}: Props) {
  return (
    <LineChart
      data={{
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            data,
          },
        ],
      }}
      width={screenWidth - 84}
      height={190}
      withDots
      withShadow={false}
      withInnerLines={false}
      withOuterLines={false}
      withVerticalLabels
      withHorizontalLabels
      bezier
      transparent
      chartConfig={{
        backgroundGradientFrom: "#FFFFFF",
        backgroundGradientTo: "#FFFFFF",

        decimalPlaces: 0,

        color: () => color,

        labelColor: () => "#8A8FA3",

        propsForDots: {
          r: "5",
          strokeWidth: "2",
          stroke: color,
        },

        propsForBackgroundLines: {
          stroke: "#ECECF5",
        },
      }}
      style={{
        borderRadius: 16,
      }}
    />
  );
}