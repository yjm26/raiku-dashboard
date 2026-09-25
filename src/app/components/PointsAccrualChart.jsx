import ChartCard, { EmptyChart } from './ChartCard.jsx';
import TrendChart from './TrendChart.jsx';

export default function PointsAccrualChart({ data = [], caption = 'Cumulative estimate for current holders' }) {
  return <ChartCard title="Points accrual" caption={caption}>{data.length ? <TrendChart data={data} dataKey="points" unit="points" gradientId="raiku-points-gradient" /> : <EmptyChart />}</ChartCard>;
}
