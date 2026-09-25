import ChartCard, { EmptyChart } from './ChartCard.jsx';
import TrendChart from './TrendChart.jsx';

export default function HolderGrowthChart({ data = [], caption = 'Current wallets by the date they first bought' }) {
  return <ChartCard title="Holder growth" caption={caption}>{data.length ? <TrendChart data={data} dataKey="holders" unit="wallets" gradientId="raiku-holders-gradient" /> : <EmptyChart />}</ChartCard>;
}
