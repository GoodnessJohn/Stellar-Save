import { useEffect, useState } from 'react';
import type { AnalyticsData, ContributionDataPoint, MemberComparisonItem } from '../types/analytics';
import { DetailedGroup, fetchGroup } from '../utils/groupApi';
import { useWallet } from './useWallet';
function calculateOnTimePaymentRate(group: DetailedGroup): number {
  if (!group.contributions || group.contributions.length === 0) {
    return 0;
  }

  const completedContributions = group.contributions.filter(c => c.status === 'completed');
  if (completedContributions.length === 0) {
    return 0;
  }

  let onTimeCount = 0;
  for (const contribution of completedContributions) {
    const cycle = group.cycles.find(c =>
      contribution.timestamp >= c.startDate && contribution.timestamp <= c.endDate
    );
    if (cycle) {
      onTimeCount++;
    }
  }

  return (onTimeCount / completedContributions.length) * 100;
}

// Helper to calculate projected completion date
function calculateProjectedCompletionDate(group: DetailedGroup): string {
  if (!group.cycles || group.cycles.length === 0 || !group.currentCycle) {
    return 'N/A';
  }

  const totalCycles = group.totalMembers; // Assuming each member gets a payout once
  const completedCycles = group.cycles.filter(c => c.status === 'completed').length;
  const remainingCycles = totalCycles - completedCycles;

  if (remainingCycles <= 0) {
    return group.cycles[group.cycles.length - 1].endDate.toISOString().split('T')[0];
  }

  const lastCompletedCycleEndDate = group.currentCycle.endDate;
  const projectedDate = new Date(lastCompletedCycleEndDate);

  // Assuming monthly cycles for simplicity, need more robust logic for other frequencies
  for (let i = 0; i < remainingCycles; i++) {
    projectedDate.setMonth(projectedDate.getMonth() + 1);
  }

  return projectedDate.toISOString().split('T')[0];
}

// Helper to generate per-cycle contribution rates
function generatePerCycleContributionRates(group: DetailedGroup): ContributionDataPoint[] {
  if (!group.cycles || group.cycles.length === 0) {
    return [];
  }

  return group.cycles.map(cycle => {
    const contributedAmount = group.contributions
      .filter(c => c.status === 'completed' && c.timestamp >= cycle.startDate && c.timestamp <= cycle.endDate)
      .reduce((sum, c) => sum + c.amount, 0);

    const expectedAmount = cycle.targetAmount;
    const contributionRate = expectedAmount > 0 ? (contributedAmount / expectedAmount) * 100 : 0;

    return {
      cycle: `Cycle ${cycle.cycleNumber}`,
      contributionRate: Math.min(Math.round(contributionRate), 100), // Cap at 100%
    };
  });
}

// Hook to fetch analytics data for a specific group
export function useGroupAnalytics(groupId: string): AnalyticsData {
  const { activeAddress } = useWallet();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    stats: { onTimePaymentRate: 0, projectedCompletionDate: '' },
    history: [],
    memberComparison: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchGroupData = async () => {
      setAnalyticsData((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const group = await fetchGroup(groupId);
        if (!group) {
          throw new Error('Group not found');
        }

        const onTimePaymentRate = calculateOnTimePaymentRate(group);
        const projectedCompletionDate = calculateProjectedCompletionDate(group);
        const history = generatePerCycleContributionRates(group);

        // TODO: Populate real member comparison data
        const memberComparison: MemberComparisonItem[] = [
          { address: activeAddress || 'GSELF...', label: 'You', onTimePercent: onTimePaymentRate },
          // Add other members if needed, calculating their individual on-time rates
        ];

        setAnalyticsData({
          stats: {
            onTimePaymentRate,
            projectedCompletionDate,
          },
          history,
          memberComparison,
          isLoading: false,
          error: null,
        });

      } catch (err) {
        console.error('Failed to fetch group analytics:', err);
        setAnalyticsData((prev) => ({ ...prev, isLoading: false, error: (err as Error).message }));
      }
    };

    fetchGroupData();
  }, [groupId, activeAddress]);

  return analyticsData;
}
