import SectionHeader from './SectionHeader.jsx';
import DistributionCard from './DistributionCard.jsx';
import NewHoldersCard from './NewHoldersCard.jsx';
import HolderFlowsCard from './HolderFlowsCard.jsx';
import HolderGrowthChart from './HolderGrowthChart.jsx';
import PointsAccrualChart from './PointsAccrualChart.jsx';

export default function InsightGrid({ snapshot }) {
  // With the holder ledger the charts are true history; without it they are estimates from today's holders.
  const exact = Boolean(snapshot.ledger);
  return <section className="mt-14" aria-labelledby="insights-title">
    <SectionHeader id="insights-title" title="Distribution and growth" />
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <DistributionCard snapshot={snapshot} />
      {snapshot.flows ? <HolderFlowsCard flows={snapshot.flows} /> : <NewHoldersCard rows={snapshot.newHolders} />}
    </div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <HolderGrowthChart data={snapshot.holderTimeline} caption={exact ? 'Personal wallets holding rkuSOL each day' : undefined} />
      <PointsAccrualChart data={snapshot.dailyTimeline} caption={exact ? 'Points earned by all wallets since launch, including wallets that left' : undefined} />
    </div>
  </section>;
}
