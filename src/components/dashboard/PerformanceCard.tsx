import ChartCard from "./ChartCard";
import DashboardLineChart from "./LineChart";

export default function PerformanceCard({ bookingTrend, revenueTrend }: { bookingTrend: number[]; revenueTrend: number[] }) {
  return (
    <>
      <ChartCard
        title="Bookings Overview"
        subtitle="Last 7 days"
      >
        <DashboardLineChart
          color="#5B3DF5"
          data={bookingTrend}
        />
      </ChartCard>

      <ChartCard
        title="Revenue Overview"
        subtitle="Last 7 days"
      >
        <DashboardLineChart
          color="#22C55E"
          data={revenueTrend}
        />
      </ChartCard>
    </>
  );
}