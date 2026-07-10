import ChartCard from "./ChartCard";
import DashboardLineChart from "./LineChart";

export default function PerformanceCard() {
  return (
    <>
      <ChartCard
        title="Bookings Overview"
        subtitle="Last 7 days"
      >
        <DashboardLineChart
          color="#5B3DF5"
          data={[5, 7, 9, 8, 11, 14, 18]}
        />
      </ChartCard>

      <ChartCard
        title="Revenue Overview"
        subtitle="Last 7 days"
      >
        <DashboardLineChart
          color="#22C55E"
          data={[220, 380, 500, 450, 610, 780, 950]}
        />
      </ChartCard>
    </>
  );
}