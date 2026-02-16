import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components';
import { useOnboarding } from '../../hooks/useOnboarding';
import {
  cleanupSeededDemoData,
  getDynamicScore,
  getGoals,
  getMonthlyTotals,
} from '../../lib/database';
import type { GoalItem } from '../../types';

const formatCompact = (value: number) =>
  `$${Math.round(value).toLocaleString()}`;

export default function PortfolioScreen() {
  const { getCurrentUserEmail } = useOnboarding();
  const [score, setScore] = useState(500);
  const [incomeSeries, setIncomeSeries] = useState<Array<{ month: string; total: number }>>([]);
  const [expenseSeries, setExpenseSeries] = useState<Array<{ month: string; total: number }>>([]);
  const [autopaySeries, setAutopaySeries] = useState<Array<{ month: string; total: number }>>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const email = await getCurrentUserEmail();
      if (!email) return;
      await cleanupSeededDemoData(email);
      const [scoreData, incomeData, expenseData, autopayData, goalData] = await Promise.all([
        getDynamicScore(email),
        getMonthlyTotals(email, 'income'),
        getMonthlyTotals(email, 'expense'),
        getMonthlyTotals(email, 'autopay'),
        getGoals(email),
      ]);
      setScore(scoreData);
      setIncomeSeries(incomeData);
      setExpenseSeries(expenseData);
      setAutopaySeries(autopayData);
      setGoals(goalData);
    };
    load();
  }, []);

  const scoreLabel = useMemo(() => {
    if (score >= 760) return 'Excellent';
    if (score >= 700) return 'Strong';
    if (score >= 640) return 'Stable';
    if (score >= 580) return 'Watchlist';
    return 'Needs Attention';
  }, [score]);

  const maxIncome = Math.max(...incomeSeries.map((x) => x.total), 1);
  const maxExpense = Math.max(...expenseSeries.map((x) => x.total), 1);
  const maxAutopay = Math.max(...autopaySeries.map((x) => x.total), 1);

  return (
    <View className="flex-1 bg-[#faf5f0]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pt-12 pb-36"
      >
        <Text variant="h1" className="text-black">Portfolio Section</Text>
        <Text variant="body" className="mt-1 text-black/65 text-[15px]">
          Dynamic score and month-wise analysis
        </Text>

        <View className="mt-5 rounded-3xl border border-black/10 bg-white p-5">
          <Text variant="body" className="text-black/55 text-[14px]">
            Financial Score
          </Text>
          <View className="mt-2 flex-row items-end gap-3">
            <Text variant="h1" className="text-black text-[52px] leading-[52px]">
              {score}
            </Text>
            <Text variant="body" className="mb-1 text-[#2E7CFF] font-semibold text-[15px]">
              {scoreLabel}
            </Text>
          </View>
          <View className="mt-3 h-3 overflow-hidden rounded-full bg-[#E5E5E5]">
            <View className="h-3 rounded-full bg-[#2E7CFF]" style={{ width: `${(score / 850) * 100}%` }} />
          </View>
        </View>

        <View className="mt-5 rounded-3xl border border-black/10 bg-white p-5">
          <Text variant="h3" className="mb-3 text-black text-[20px]">
            Total Saved, Month Wise
          </Text>
          <View className="flex-row items-end gap-2">
            {incomeSeries.map((item, idx) => (
              <View key={`income-${idx}`} className="flex-1 items-center">
                <View
                  className="w-full rounded-t-lg bg-[#2E7CFF]"
                  style={{ height: 16 + (item.total / maxIncome) * 92 }}
                />
                <Text variant="small" className="mt-2 text-black/45 text-[11px]">
                  {item.month}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mt-5 rounded-3xl border border-black/10 bg-white p-5">
          <Text variant="h3" className="mb-3 text-black text-[20px]">
            Total Expense, Month Wise
          </Text>
          <View className="flex-row items-end gap-2">
            {expenseSeries.map((item, idx) => (
              <View key={`expense-${idx}`} className="flex-1 items-center">
                <View
                  className="w-full rounded-t-lg bg-[#B95C56]"
                  style={{ height: 16 + (item.total / maxExpense) * 92 }}
                />
                <Text variant="small" className="mt-2 text-black/45 text-[11px]">
                  {item.month}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mt-5 rounded-3xl border border-black/10 bg-white p-5">
          <Text variant="h3" className="mb-3 text-black text-[20px]">
            Autopay Analysis
          </Text>
          <View className="mb-3 flex-row items-end gap-2">
            {autopaySeries.map((item, idx) => (
              <View key={`autopay-${idx}`} className="flex-1 items-center">
                <View
                  className="w-full rounded-t-lg bg-[#C1813D]"
                  style={{ height: 12 + (item.total / maxAutopay) * 80 }}
                />
                <Text variant="small" className="mt-2 text-black/45 text-[11px]">
                  {item.month}
                </Text>
              </View>
            ))}
          </View>
          <View className="flex-row items-center gap-2 rounded-2xl bg-[#F6F8FF] p-3">
            <Ionicons name="flash" size={18} color="#2E7CFF" />
            <Text variant="caption" className="text-black/70 text-[13px]">
              Recurring autopays are included in score and savings trend.
            </Text>
          </View>
        </View>

        <View className="mt-5 rounded-3xl border border-black/10 bg-white p-5">
          <Text variant="h3" className="mb-3 text-black text-[20px]">
            Goal Analysis
          </Text>
          {goals.length === 0 ? (
            <Text variant="body" className="text-black/55 text-[14px]">
              No goals added yet.
            </Text>
          ) : (
            goals.map((goal) => {
              const pct = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
              return (
                <View key={goal.id} className="mb-4">
                  <View className="mb-1 flex-row items-center justify-between">
                    <Text variant="body" className="text-black/75 text-[14px]">{goal.name}</Text>
                    <Text variant="body" className="text-black text-[14px]">
                      {formatCompact(goal.current_amount)} / {formatCompact(goal.target_amount)}
                    </Text>
                  </View>
                  <View className="h-2.5 overflow-hidden rounded-full bg-[#E5E5E5]">
                    <View className="h-2.5 rounded-full bg-[#2E7CFF]" style={{ width: `${pct}%` }} />
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
