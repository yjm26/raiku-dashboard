import ChartCard, { EmptyChart } from './ChartCard.jsx';
import TrendChart from './TrendChart.jsx';

export default function HolderGrowthChart({ data = [] }) {
  return <ChartCard title="Holder growth" caption="Real wallets since launch">{data.length ? <TrendChart data={data} dataKey="holders" unit="wallets" gradientId="raiku-holders-gradient" /> : <EmptyChart />}</ChartCard>;
}
