import { StatsOverview } from "../components/StatsOverview.jsx";
import { PageTitle } from "../components/PageTitle.jsx";

export default function OverviewPage() {
  return (
    <>
      <PageTitle
        title="Overview"
        sub="Salons, money and usage across Salora Glam."
      />
      <StatsOverview />
    </>
  );
}
