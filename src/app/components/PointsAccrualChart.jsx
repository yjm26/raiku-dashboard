import ChartCard, { EmptyChart } from './ChartCard.jsx';
import TrendChart from './TrendChart.jsx';

export default function PointsAccrualChart({ data = [] }) {
  return <ChartCard title="Points accrual" caption="Cumulative estimate since launch">{data.length ? <TrendChart data={data} dataKey="points" unit="points" gradientId="raiku-points-gradient" /> : <EmptyChart />}</ChartCard>;
}
