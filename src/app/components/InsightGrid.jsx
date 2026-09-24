import SectionHeader from './SectionHeader.jsx';
import DistributionCard from './DistributionCard.jsx';
import NewHoldersCard from './NewHoldersCard.jsx';
import HolderGrowthChart from './HolderGrowthChart.jsx';
import PointsAccrualChart from './PointsAccrualChart.jsx';

export default function InsightGrid({ snapshot }) {
  return <section className="mt-14" aria-labelledby="insights-title">
    <SectionHeader id="insights-title" title="Distribution and growth" />
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"><DistributionCard snapshot={snapshot} /><NewHoldersCard rows={snapshot.newHolders} /></div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2"><HolderGrowthChart data={snapshot.holderTimeline} /><PointsAccrualChart data={snapshot.dailyTimeline} /></div>
  </section>;
}
