import PointsAccrualChart from './PointsAccrualChart.jsx';
import HolderGrowthChart from './HolderGrowthChart.jsx';
import DistributionCard from './DistributionCard.jsx';
import TopHoldersCard from './TopHoldersCard.jsx';
import NewHoldersCard from './NewHoldersCard.jsx';
import ApyTvlCharts from './ApyTvlCharts.jsx';
export default function InsightGrid({ snapshot }) {
  return <section className="mt-6" aria-labelledby="insights-title">
    <div className="mb-3 flex min-h-10 items-center border-b border-rule px-2 py-2"><h2 id="insights-title" className="m-0 text-[15px] font-normal text-ink">Performance / Network insights</h2></div>
    <div className="grid gap-3 lg:grid-cols-[2fr_1fr]"><PointsAccrualChart data={snapshot.dailyTimeline} /><DistributionCard snapshot={snapshot} /></div>
    <div className="mt-3 grid gap-3 lg:grid-cols-[2fr_1fr]"><HolderGrowthChart data={snapshot.holderTimeline} /><TopHoldersCard rows={snapshot.topHolders} /></div>
    <ApyTvlCharts history={snapshot.history} />
    <div className="mt-3 grid gap-3 lg:grid-cols-[2fr_1fr]"><NewHoldersCard rows={snapshot.newHolders} /><div className="min-h-[280px] border border-rule bg-surface p-4"><p className="m-0 text-[12px] text-muted">Data note</p><h2 className="mt-1 text-[15px] font-normal text-ink">Coverage and method</h2><p className="mt-3 text-[13px] leading-5 text-muted">Points are estimated from balance × days held. Pool and program accounts are separated from real wallets.</p></div></div>
  </section>;
}
