import PointsAccrualChart from './PointsAccrualChart.jsx';
import HolderGrowthChart from './HolderGrowthChart.jsx';
import DistributionCard from './DistributionCard.jsx';
import TopHoldersCard from './TopHoldersCard.jsx';
import NewHoldersCard from './NewHoldersCard.jsx';

export default function InsightGrid({ snapshot }) {
  return <section className="insights" aria-labelledby="insights-title"><div className="section-heading"><div><p className="section-heading__eyebrow">Read the signal</p><h2 id="insights-title">Network insights</h2></div></div><div className="insights-grid insights-grid--charts"><PointsAccrualChart data={snapshot.dailyTimeline} /><HolderGrowthChart data={snapshot.holderTimeline} /></div><div className="insights-grid insights-grid--support"><DistributionCard snapshot={snapshot} /><TopHoldersCard rows={snapshot.topHolders} /><NewHoldersCard rows={snapshot.newHolders} /></div></section>;
}
