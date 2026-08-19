import PointsAccrualChart from './PointsAccrualChart.jsx';
import HolderGrowthChart from './HolderGrowthChart.jsx';
import DistributionCard from './DistributionCard.jsx';
import TopHoldersCard from './TopHoldersCard.jsx';
import NewHoldersCard from './NewHoldersCard.jsx';
export default function InsightGrid({ snapshot }) {
  return <section className="mt-4" aria-labelledby="insights-title">
    <div className="mb-2 flex items-center justify-between border-b-2 border-rule bg-surface-muted px-2 py-2"><div><p className="m-0 font-mono text-[10px] uppercase tracking-wide text-muted">Read the signal</p><h2 id="insights-title" className="m-0 text-sm font-bold uppercase">Performance / Network insights</h2></div></div>
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]"><PointsAccrualChart data={snapshot.dailyTimeline} /><DistributionCard snapshot={snapshot} /></div>
    <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]"><HolderGrowthChart data={snapshot.holderTimeline} /><TopHoldersCard rows={snapshot.topHolders} /></div>
    <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]"><NewHoldersCard rows={snapshot.newHolders} /><div className="min-h-[280px] border border-rule bg-surface p-4"><p className="m-0 font-mono text-[10px] uppercase tracking-wide text-muted">Data note</p><h2 className="mt-2 text-sm font-bold uppercase">Coverage and method</h2><p className="mt-4 text-sm leading-6 text-muted">Points are estimated from balance × days held. Pool and program accounts are separated from real wallets.</p></div></div>
  </section>;
}
