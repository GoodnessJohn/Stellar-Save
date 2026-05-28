export interface ContributionDataPoint {
  cycle: string; // e.g. "Jan 2025" or "Cycle 1"
  contributionRate: number; // percentage
}

export interface MemberComparisonItem {
  address: string;
  label: string; // shortened address or "You"
  onTimePercent: number;
}

export interface GroupAnalyticsStats {
  onTimePaymentRate: number; // overall on-time payment percentage for the group
  projectedCompletionDate: string; // ISO string date
}

export interface AnalyticsData {
  stats: GroupAnalyticsStats;
  history: ContributionDataPoint[];
  memberComparison: MemberComparisonItem[];
  isLoading: boolean;
  error: string | null;
}
