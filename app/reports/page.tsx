import ReportsClient from "@/components/reports/ReportsClient";

type Props = {
  searchParams: Promise<{ report?: string }>;
};

export default async function ReportsPage({ searchParams }: Props) {
  const { report } = await searchParams;
  return <ReportsClient initialReport={report ?? "1"} />;
}
