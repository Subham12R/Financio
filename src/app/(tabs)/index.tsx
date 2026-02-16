import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Text } from '../../components';
import { useOnboarding } from '../../hooks/useOnboarding';
import {
  addFinanceEntry,
  addGoal,
  addToGoalProgress,
  cleanupSeededDemoData,
  createAutopayPlan,
  deleteGoal,
  deleteFinanceEntry,
  getBudgetOverview,
  getAutopayPlans,
  getAvailableMoney,
  getFinanceEntriesByKind,
  getFinanceSummary,
  getGoals,
  getSetting,
  getMonthlyTotals,
  processAutopayPlans,
  removeAutopayPlan,
  getUserByEmail,
  setSetting,
  upsertBudget,
} from '../../lib/database';
import type { AutoPayCadence, AutoPayPlan, FinanceEntry, FinanceKind, GoalItem, User } from '../../types';

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatMonthKey = (monthKey: string) => {
  const [y, m] = monthKey.split('-');
  const monthNum = Number(m);
  if (!y || !monthNum || monthNum < 1 || monthNum > 12) return monthKey;
  const monthLabel = new Date(Number(y), monthNum - 1, 1).toLocaleString('en-US', {
    month: 'short',
  });
  return `${monthLabel} ${y}`;
};

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y.slice(2)}`;
};

const getCurrentMonthInput = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
};

type BudgetOverview = {
  currentMonthKey: string;
  currentBudget: number;
  totalBudget: number;
  savingsToDate: number;
};

type MonthSeries = Array<{ month: string; total: number }>;

const buildSegmentWidths = (values: number[], totalFillPercent: number) => {
  const safeFill = Math.max(0, Math.min(100, totalFillPercent));
  if (safeFill === 0) return values.map(() => 0);
  const sum = values.reduce((acc, val) => acc + Math.max(0, val), 0);
  if (sum <= 0) {
    const even = safeFill / Math.max(values.length, 1);
    return values.map(() => even);
  }
  return values.map((val) => (Math.max(0, val) / sum) * safeFill);
};

const parseActiveGoalIds = (raw: string | null) =>
  new Set(
    (raw ?? '')
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isFinite(id) && id > 0)
  );

const serializeActiveGoalIds = (ids: Set<number>) => Array.from(ids).sort((a, b) => a - b).join(',');

const getCategoryImage = (category: string, title: string) => {
  const key = `${category} ${title}`.toLowerCase();
  if (key.includes('income')) return require('../../../assets/wallet.png');
  if (key.includes('autopay')) return require('../../../assets/Autopay.webp');
  if (key.includes('food')) return require('../../../assets/Food.png');
  if (key.includes('grocery')) return require('../../../assets/grocery.png');
  if (key.includes('travel') || key.includes('trip')) return require('../../../assets/travel.png');
  if (key.includes('goal') || key.includes('wallet')) return require('../../../assets/wallet.png');
  return require('../../../assets/icon.png');
};

const cadenceLabels: Record<AutoPayCadence, string> = {
  '1d': '1 day',
  '7d': '7 day',
  '15d': '15 day',
  monthly: 'Monthly',
};

const expenseCategoryColors = ['#4A9D62', '#2E7CFF', '#6861B8', '#C1813D', '#B95C56'];

export default function HomeScreen() {
  const router = useRouter();
  const { getCurrentUserEmail } = useOnboarding();
  const [user, setUser] = useState<User | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);

  const [summary, setSummary] = useState({
    month: new Date().toLocaleString('en-US', { month: 'long' }),
    income: 0,
    expense: 0,
    autopay: 0,
    savings: 0,
  });
  const [availableMoney, setAvailableMoney] = useState(0);
  const [budget, setBudget] = useState<BudgetOverview>({
    currentMonthKey: getCurrentMonthInput(),
    currentBudget: 0,
    totalBudget: 0,
    savingsToDate: 0,
  });
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [incomes, setIncomes] = useState<FinanceEntry[]>([]);
  const [expenses, setExpenses] = useState<FinanceEntry[]>([]);
  const [autopays, setAutopays] = useState<AutoPayPlan[]>([]);
  const [expenseSeries, setExpenseSeries] = useState<MonthSeries>([]);
  const [incomeSeries, setIncomeSeries] = useState<MonthSeries>([]);
  const [autopaySeries, setAutopaySeries] = useState<MonthSeries>([]);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedKind, setSelectedKind] = useState<FinanceKind | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [autopayCadence, setAutopayCadence] = useState<AutoPayCadence>('monthly');

  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetMonth, setBudgetMonth] = useState(getCurrentMonthInput());

  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDate, setGoalDate] = useState(new Date().toISOString().slice(0, 10));
  const [goalAllocateModalVisible, setGoalAllocateModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalItem | null>(null);
  const [goalAllocationAmount, setGoalAllocationAmount] = useState('');
  const [goalAllocationDate, setGoalAllocationDate] = useState(new Date().toISOString().slice(0, 10));
  const [activeGoalIds, setActiveGoalIds] = useState<Set<number>>(new Set());
  const [selectedIncomeId, setSelectedIncomeId] = useState<number | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);
  const [selectedAutopayId, setSelectedAutopayId] = useState<number | null>(null);

  const loadDashboard = async (email: string) => {
    await processAutopayPlans(email);
    const [userData, summaryData, budgetData, goalData, incomeRows, expenseRows, autopayRows, incomeMonths, expenseMonths, autopayMonths, activeGoalSetting, availableMoneyData, profilePhoto] = await Promise.all([
      getUserByEmail(email),
      getFinanceSummary(email),
      getBudgetOverview(email),
      getGoals(email),
      getFinanceEntriesByKind(email, 'income', 30),
      getFinanceEntriesByKind(email, 'expense', 30),
      getAutopayPlans(email),
      getMonthlyTotals(email, 'income', 6),
      getMonthlyTotals(email, 'expense', 6),
      getMonthlyTotals(email, 'autopay', 6),
      getSetting(`active_goals_${email}`),
      getAvailableMoney(email),
      getSetting(`profile_photo_${email}`),
    ]);
    setUser(userData as User);
    setSummary(summaryData);
    setBudget(budgetData);
    setGoals(goalData);
    setIncomes(incomeRows);
    setExpenses(expenseRows);
    setAutopays(autopayRows);
    setIncomeSeries(incomeMonths);
    setExpenseSeries(expenseMonths);
    setAutopaySeries(autopayMonths);
    setAvailableMoney(availableMoneyData);
    setProfilePhotoUri(profilePhoto);
    const parsed = parseActiveGoalIds(activeGoalSetting);
    const validIds = new Set(goalData.map((goal) => goal.id));
    setActiveGoalIds(new Set(Array.from(parsed).filter((id) => validIds.has(id))));
  };

  useEffect(() => {
    const init = async () => {
      const email = await getCurrentUserEmail();
      if (!email) return;
      setUserEmail(email);
      await cleanupSeededDemoData(email);
      await loadDashboard(email);
    };
    init();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      const syncProfilePhoto = async () => {
        const email = userEmail ?? (await getCurrentUserEmail());
        if (!email) return;
        const photo = await getSetting(`profile_photo_${email}`);
        if (active) setProfilePhotoUri(photo);
      };
      syncProfilePhoto();
      return () => {
        active = false;
      };
    }, [userEmail, getCurrentUserEmail])
  );

  const savingsPct = useMemo(() => {
    if (budget.totalBudget <= 0) return 0;
    return Math.max(0, Math.min(100, (budget.savingsToDate / budget.totalBudget) * 100));
  }, [budget]);

  const expensesPct = useMemo(() => {
    if (budget.currentBudget <= 0) return 0;
    return Math.max(0, Math.min(100, (summary.expense / budget.currentBudget) * 100));
  }, [summary.expense, budget.currentBudget]);

  const savingsSeries = useMemo(
    () => incomeSeries.map((row, idx) => ({
      month: row.month,
      total: Math.max(0, row.total - (expenseSeries[idx]?.total ?? 0) - (autopaySeries[idx]?.total ?? 0)),
    })),
    [incomeSeries, expenseSeries, autopaySeries]
  );
  const expenseCategorySegments = useMemo(() => {
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const totalsByCategory = new Map<string, number>();
    for (const row of expenses) {
      if (!row.entry_date.startsWith(currentMonthKey)) continue;
      const key = row.category.trim() || 'General';
      totalsByCategory.set(key, (totalsByCategory.get(key) ?? 0) + row.amount);
    }
    const ranked = Array.from(totalsByCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const widths = buildSegmentWidths(
      ranked.map((entry) => entry[1]),
      expensesPct
    );
    return ranked.map((entry, index) => ({
      category: entry[0],
      width: widths[index] ?? 0,
      color: expenseCategoryColors[index % expenseCategoryColors.length],
    }));
  }, [expenses, expensesPct]);
  const currentMonthOutflow = summary.expense + summary.autopay;
  const monthlyLimitPct = budget.currentBudget > 0
    ? Math.max(0, Math.min(100, (currentMonthOutflow / budget.currentBudget) * 100))
    : 0;

  const resetEntryState = () => {
    setSelectedKind(null);
    setTitle('');
    setAmount('');
    setCategory('');
    setEntryDate(new Date().toISOString().slice(0, 10));
    setAutopayCadence('monthly');
  };

  const closeAddModal = () => {
    setAddModalVisible(false);
    resetEntryState();
  };

  const openAddForKind = (kind: FinanceKind) => {
    setSelectedKind(kind);
    setAddModalVisible(true);
  };

  const handleSaveEntry = async () => {
    if (!selectedKind || !userEmail) return;
    const parsedAmount = Number(amount);
    const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(entryDate);
    if (!title.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || !dateOk) return;

    if (selectedKind === 'autopay') {
      await createAutopayPlan({
        userEmail,
        title: title.trim(),
        amount: parsedAmount,
        cadence: autopayCadence,
        startDate: entryDate,
      });
    } else {
      await addFinanceEntry({
        userEmail,
        kind: selectedKind,
        title: title.trim(),
        amount: parsedAmount,
        category: category.trim() || 'General',
        entryDate,
      });
    }
    await loadDashboard(userEmail);
    closeAddModal();
  };

  const resolveGoalIdFromEntry = (entry: FinanceEntry) => {
    const sourceKey = entry.source_key ?? '';
    if (sourceKey.startsWith('goal:')) {
      const parsed = Number(sourceKey.slice(5));
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    const titleMatch = entry.title.match(/^Goal:\s*(.+)$/i);
    if (!titleMatch) return null;
    const goalName = titleMatch[1].trim();
    const match = goals.find((goal) => goal.name.trim().toLowerCase() === goalName.toLowerCase());
    return match?.id ?? null;
  };

  const handleDeleteEntry = (entryId: number, entry?: FinanceEntry) => {
    if (!userEmail) return;
    Alert.alert('Delete Entry', 'Do you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteFinanceEntry(userEmail, entryId);
          if (entry && entry.kind === 'expense' && entry.category.trim().toLowerCase() === 'goal') {
            const goalId = resolveGoalIdFromEntry(entry);
            if (goalId) {
              await addToGoalProgress({
                userEmail,
                goalId,
                amount: -Math.abs(entry.amount),
              });
            }
          }
          setSelectedIncomeId(null);
          setSelectedExpenseId(null);
          setSelectedAutopayId(null);
          await loadDashboard(userEmail);
        },
      },
    ]);
  };

  const handleRemoveAutopay = (planId: number) => {
    if (!userEmail) return;
    Alert.alert('Remove Autopay', 'This autopay will stop generating future expenses.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeAutopayPlan(userEmail, planId);
          setSelectedAutopayId(null);
          await loadDashboard(userEmail);
        },
      },
    ]);
  };

  const openBudgetModal = () => {
    setBudgetAmount(budget.currentBudget > 0 ? String(budget.currentBudget) : '');
    setBudgetMonth(budget.currentMonthKey || getCurrentMonthInput());
    setBudgetModalVisible(true);
  };

  const handleSaveBudget = async () => {
    if (!userEmail) return;
    const parsedAmount = Number(budgetAmount);
    const monthOk = /^\d{4}-\d{2}$/.test(budgetMonth);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || !monthOk) return;

    await upsertBudget({
      userEmail,
      amount: parsedAmount,
      monthKey: budgetMonth,
    });
    await loadDashboard(userEmail);
    setBudgetModalVisible(false);
  };

  const handleSaveGoal = async () => {
    if (!userEmail) return;
    const current = Number(goalCurrent);
    const target = Number(goalTarget);
    if (!goalName.trim() || !Number.isFinite(current) || !Number.isFinite(target) || target <= 0) return;

    await addGoal({
      userEmail,
      name: goalName.trim(),
      currentAmount: Math.max(0, current),
      targetAmount: target,
      targetDate: /^\d{4}-\d{2}-\d{2}$/.test(goalDate) ? goalDate : null,
    });
    await loadDashboard(userEmail);
    setGoalName('');
    setGoalCurrent('');
    setGoalTarget('');
    setGoalDate(new Date().toISOString().slice(0, 10));
    setGoalModalVisible(false);
  };

  const openGoalAllocateModal = (goal: GoalItem) => {
    setSelectedGoal(goal);
    setGoalAllocationAmount('');
    setGoalAllocationDate(new Date().toISOString().slice(0, 10));
    setGoalAllocateModalVisible(true);
  };

  const handleAllocateToGoal = async () => {
    if (!userEmail || !selectedGoal) return;
    const parsed = Number(goalAllocationAmount);
    const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(goalAllocationDate);
    if (!Number.isFinite(parsed) || parsed <= 0 || !dateOk) return;

    await addFinanceEntry({
      userEmail,
      kind: 'expense',
      title: `Goal: ${selectedGoal.name}`,
      amount: parsed,
      category: 'goal',
      entryDate: goalAllocationDate,
      sourceKey: `goal:${selectedGoal.id}`,
    });
    await addToGoalProgress({
      userEmail,
      goalId: selectedGoal.id,
      amount: parsed,
    });
    await loadDashboard(userEmail);
    setGoalAllocateModalVisible(false);
    setSelectedGoal(null);
  };

  const handleToggleActiveGoal = async (goalId: number) => {
    if (!userEmail) return;
    const updated = new Set(activeGoalIds);
    if (updated.has(goalId)) {
      updated.delete(goalId);
    } else {
      updated.add(goalId);
    }
    await setSetting(`active_goals_${userEmail}`, serializeActiveGoalIds(updated));
    setActiveGoalIds(updated);
  };

  const handleDeleteGoal = (goalId: number) => {
    if (!userEmail) return;
    Alert.alert('Delete Goal', 'Do you want to delete this goal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteGoal(userEmail, goalId);
          const updated = new Set(activeGoalIds);
          if (updated.has(goalId)) {
            updated.delete(goalId);
            await setSetting(`active_goals_${userEmail}`, serializeActiveGoalIds(updated));
            setActiveGoalIds(updated);
          }
          await loadDashboard(userEmail);
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-[#faf5f0]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pt-12 pb-40 mt-8"
      >
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text variant="caption" className="text-black/50 text-[12px]">Dashboard</Text>
            <Text variant="h2" className="text-black text-[24px] leading-[30px]">
             Welcome, {user?.username || 'User'}
            </Text>
          </View>
          <TouchableOpacity
            className="h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-black/10 bg-white"
            onPress={() => router.push('/accounts')}
            activeOpacity={0.85}
          >
            {profilePhotoUri ? (
              <Image source={{ uri: profilePhotoUri }} style={{ width: 48, height: 48 }} resizeMode="cover" />
            ) : (
              <Ionicons name="person" size={20} color="#1A1A1A" />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="mb-4 overflow-hidden rounded-3xl border border-black/10 bg-[#1A1E2F]"
          onPress={openBudgetModal}
          activeOpacity={0.9}
        >
          <View className="px-5 py-4">
            <Text variant="caption" className="text-white/70 text-[12px]">Total Money</Text>
            <View className="mt-2 flex-row items-end gap-2">
              <Text variant="h2" className="text-white text-[34px] leading-[38px]">
                {formatCurrency(availableMoney)}
              </Text>
              <Text variant="caption" className="mb-1 text-white/70 text-[14px]">
                available
              </Text>
            </View>
            <View className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
              <View className="h-2 rounded-full bg-[#62F7A5]" style={{ width: `${monthlyLimitPct}%` }} />
            </View>
            <View className="mt-3 flex-row items-center justify-between">
              <Text variant="caption" className="text-white/70 text-[13px]">
                {budget.currentBudget > 0 ? `${formatCurrency(budget.currentBudget)} monthly limit` : 'Set monthly limit'}
              </Text>
              <Text variant="caption" className="text-white text-[13px] font-semibold">
                {formatCurrency(currentMonthOutflow)} spent this month
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View className="mb-4 rounded-3xl border border-zinc-200 bg-white p-4">
          <Text variant="body" className="mb-3 text-black/80 text-[18px] font-semibold">
            Savings & Expenses
          </Text>
          <View className="flex-row gap-3">
            <View className="flex-1 rounded-3xl border border-black/10 bg-[#F7F7F7] p-4">
              <Text variant="body" className="text-black/60 text-[14px]">Savings</Text>
              <Text variant="h1" className="mt-3 text-black text-[28px] leading-[32px]">
                {formatCurrency(budget.savingsToDate)}
              </Text>
              <Text variant="caption" className="mt-1 text-black/60 text-[14px]">
                saved till date
              </Text>
              <View className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#DCDCDC]">
                <View className="h-2.5 rounded-full bg-[#2E7CFF]" style={{ width: `${savingsPct}%` }} />
              </View>
            </View>

            <View className="flex-1 rounded-3xl border border-black/10 bg-[#F7F7F7] p-4">
              <Text variant="body" className="text-black/60 text-[14px]">Expenses in</Text>
              <Text variant="body" className="text-black text-[18px] font-semibold">{summary.month}</Text>
              <Text variant="h1" className="mt-2 text-black text-[28px] leading-[32px]">
                {formatCurrency(summary.expense)}
              </Text>
              <Text variant="caption" className="mt-1 text-black/60 text-[14px]">
                spent out of <Text variant="caption" className="text-black font-semibold text-[14px]">
                  {budget.currentBudget > 0 ? formatCurrency(budget.currentBudget) : '₹0.00'}
                </Text>
              </Text>
              <View className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#DCDCDC]">
                <View className="h-2.5 flex-row">
                  {expenseCategorySegments.map((segment) => (
                    <View
                      key={segment.category}
                      className="h-2.5"
                      style={{ width: `${segment.width}%`, backgroundColor: segment.color }}
                    />
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className="mb-4 rounded-3xl border border-black/10 bg-white p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text variant="h3" className="text-black text-[20px]">
              Goals <Text variant="h3" className="text-black/40 text-[20px] italic">({goals.length})</Text>
            </Text>
            <TouchableOpacity
              className="rounded-full border border-black/10 bg-[#F3F3F3] px-4 py-2"
              onPress={() => setGoalModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text variant="body" className="text-black text-[16px]">+ Add</Text>
            </TouchableOpacity>
          </View>

          {goals.length === 0 ? (
            <Text variant="body" className="text-black/55 text-[14px]">
              No goals added yet.
            </Text>
          ) : (
            goals.map((goal) => {
              const goalPct = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
              const isActive = activeGoalIds.has(goal.id);
              return (
                <TouchableOpacity
                  key={goal.id}
                  onPress={() => openGoalAllocateModal(goal)}
                  activeOpacity={0.9}
                  className={`mb-3 rounded-2xl border p-3 ${isActive ? 'border-[#2E7CFF]/35 bg-[#F7FAFF]' : 'border-black/10 bg-[#F7F7F7]'}`}
                  style={{ opacity: isActive ? 1 : 0.55 }}
                >
                  <View className="mb-2 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Text variant="h2" className="text-black text-[20px]">{goal.name}</Text>
                    </View>
                    <View className=" items-end gap-1.5 inline-flex flex-row">
                      <TouchableOpacity
                        className={`h-8 w-8 items-center justify-center rounded-full ${isActive ? 'bg-black/75' : 'border border-black/15 bg-white'}`}
                        onPress={() => handleToggleActiveGoal(goal.id)}
                        activeOpacity={0.85}
                        accessibilityLabel={isActive ? 'Disable goal' : 'Set goal active'}
                      >
                        <Ionicons
                          name={isActive ? 'pause' : 'play'}
                          size={14}
                          color={isActive ? '#FFFFFF' : '#1A1A1A'}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="h-8 w-8 items-center justify-center rounded-full border border-[#B95C56]/35 bg-[#FFF5F4]"
                        onPress={() => handleDeleteGoal(goal.id)}
                        activeOpacity={0.85}
                        accessibilityLabel="Delete goal"
                      >
                        <Ionicons name="trash-outline" size={14} color="#B95C56" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text variant="h1" className="text-black text-[24px] leading-[30px]">
                    {formatCurrency(goal.current_amount)}{' '}
                    <Text variant="h1" className="text-black/40 text-[24px]">out of</Text>{' '}
                    {formatCurrency(goal.target_amount)}
                  </Text>
                  <View className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#E5E5E5]">
                    <View className={`h-2.5 rounded-full ${isActive ? 'bg-[#2E7CFF]' : 'bg-[#B95C56]'}`} style={{ width: `${goalPct}%` }} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View className="mb-4 rounded-3xl border border-black/10 bg-white p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text variant="h3" className="text-black text-[20px]">Incomes</Text>
            <TouchableOpacity
              className="rounded-full border border-black/10 bg-[#F3F3F3] px-4 py-2"
              onPress={() => openAddForKind('income')}
              activeOpacity={0.85}
            >
              <Text variant="body" className="text-black text-[16px]">+ Add</Text>
            </TouchableOpacity>
          </View>
          <View className="h-56">
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
              {incomes.length === 0 ? (
                <View className="px-3 py-4">
                  <Text variant="caption" className="text-black/45 text-[13px]">No income entries yet.</Text>
                </View>
              ) : (
                incomes.map((row) => {
                  const showDelete = selectedIncomeId === row.id;
                  const imageSource = getCategoryImage('income', row.title);
                  return (
                    <TouchableOpacity
                      key={row.id}
                      onPress={() => setSelectedIncomeId(showDelete ? null : row.id)}
                      activeOpacity={0.85}
                      className="mb-2 flex-row items-center px-1 py-4"
                    >
                      <View className="mr-3 h-12 w-12 items-center justify-center">
                        <Image source={imageSource} style={{ width: 42, height: 42 }} resizeMode="contain" />
                      </View>
                      <View className="flex-1">
                        <Text variant="body" className="text-black text-[18px]">{row.title}</Text>
                        <Text variant="caption" className="text-black/55 text-[12px]">
                          {formatDate(row.entry_date)}
                        </Text>
                      </View>
                      <View className="items-end">
                        {showDelete ? (
                          <TouchableOpacity onPress={() => handleDeleteEntry(row.id, row)} className="rounded-lg bg-[#B95C56] px-2 py-1">
                            <Text variant="caption" className="text-white text-[12px] font-semibold">Delete</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text variant="body" className="text-[#1F9D55] text-[20px] leading-[24px] font-semibold">{formatCurrency(row.amount)}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>

        <View className="mb-4 rounded-3xl border border-black/10 bg-white p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text variant="h3" className="text-black text-[20px]">Expenses</Text>
            <TouchableOpacity
              className="rounded-full border border-black/10 bg-[#F3F3F3] px-4 py-2"
              onPress={() => openAddForKind('expense')}
              activeOpacity={0.85}
            >
              <Text variant="body" className="text-black text-[16px]">+ Add</Text>
            </TouchableOpacity>
          </View>
          <View className="h-56">
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
              {expenses.length === 0 ? (
                <View className="px-3 py-4">
                  <Text variant="caption" className="text-black/45 text-[13px]">No expense entries yet.</Text>
                </View>
              ) : (
                expenses.map((row) => {
                  const showDelete = selectedExpenseId === row.id;
                  const imageSource = getCategoryImage(row.category, row.title);
                  return (
                    <TouchableOpacity
                      key={row.id}
                      onPress={() => setSelectedExpenseId(showDelete ? null : row.id)}
                      activeOpacity={0.85}
                      className="mb-2 flex-row items-center px-1 py-4"
                    >
                      <View className="mr-3 h-12 w-12 items-center justify-center">
                        <Image source={imageSource} style={{ width: 42, height: 42 }} resizeMode="contain" />
                      </View>
                      <View className="flex-1">
                        <Text variant="body" className="text-black text-[18px]">{row.title}</Text>
                        <Text variant="caption" className="text-black/55 text-[12px]">
                          {row.category} - {formatDate(row.entry_date)}
                        </Text>
                      </View>
                      <View className="items-end">
                        {showDelete ? (
                          <TouchableOpacity onPress={() => handleDeleteEntry(row.id, row)} className="rounded-lg bg-[#B95C56] px-2 py-1">
                            <Text variant="caption" className="text-white text-[12px] font-semibold">Delete</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text variant="body" className="text-[#B95C56] text-[20px] leading-[24px] font-semibold">{formatCurrency(row.amount)}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>

        <View className="rounded-3xl border border-black/10 bg-white p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text variant="h3" className="text-black text-[20px]">Autopays</Text>
            <TouchableOpacity
              className="rounded-full border border-black/10 bg-[#F3F3F3] px-4 py-2"
              onPress={() => openAddForKind('autopay')}
              activeOpacity={0.85}
            >
              <Text variant="body" className="text-black text-[16px]">+ Add</Text>
            </TouchableOpacity>
          </View>
          <View className="h-56">
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
              {autopays.length === 0 ? (
                <View className="px-3 py-4">
                  <Text variant="caption" className="text-black/45 text-[13px]">No autopay entries yet.</Text>
                </View>
              ) : (
                autopays.map((row) => {
                  const showDelete = selectedAutopayId === row.id;
                  const imageSource = getCategoryImage('autopay', row.title);
                  return (
                    <TouchableOpacity
                      key={row.id}
                      onPress={() => setSelectedAutopayId(showDelete ? null : row.id)}
                      activeOpacity={0.85}
                      className="mb-2 flex-row items-center px-1 py-4"
                    >
                      <View className="mr-3 h-12 w-12 items-center justify-center">
                        <Image source={imageSource} style={{ width: 42, height: 42 }} resizeMode="contain" />
                      </View>
                      <View className="flex-1">
                        <Text variant="body" className="text-black text-[18px]">{row.title}</Text>
                        <Text variant="caption" className="text-black/55 text-[12px]">
                          {cadenceLabels[row.cadence]} - next {formatDate(row.next_payment_date)}
                        </Text>
                      </View>
                      <View className="items-end">
                        {showDelete ? (
                          <TouchableOpacity onPress={() => handleRemoveAutopay(row.id)} className="rounded-lg bg-[#B95C56] px-2 py-1">
                            <Text variant="caption" className="text-white text-[12px] font-semibold">Remove</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text variant="body" className="text-black/80 text-[26px] leading-[30px] font-semibold">{formatCurrency(row.amount)}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      <Modal transparent animationType="fade" visible={goalAllocateModalVisible} onRequestClose={() => setGoalAllocateModalVisible(false)}>
        <View className="flex-1 items-center justify-center bg-black/35 px-6">
          <View className="w-full rounded-3xl bg-white p-5">
            <Text variant="h3" className="mb-3 text-black text-[20px]">
              Allocate To Goal
            </Text>
            <Text variant="body" className="mb-3 text-black/65 text-[14px]">
              {selectedGoal?.name || 'Selected Goal'}
            </Text>
            <TextInput
              value={goalAllocationAmount}
              onChangeText={setGoalAllocationAmount}
              keyboardType="decimal-pad"
              placeholder="Amount"
              placeholderTextColor="rgba(0,0,0,0.35)"
              className="mb-3 rounded-xl border border-black/10 bg-[#F7F7F7] px-4 py-3 text-[15px] text-black"
            />
            <TextInput
              value={goalAllocationDate}
              onChangeText={setGoalAllocationDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="rgba(0,0,0,0.35)"
              className="mb-4 rounded-xl border border-black/10 bg-[#F7F7F7] px-4 py-3 text-[15px] text-black"
            />
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 items-center rounded-xl bg-[#E9E9E9] py-3"
                onPress={() => setGoalAllocateModalVisible(false)}
              >
                <Text variant="body" className="text-black text-[15px]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 items-center rounded-xl bg-[#2E7CFF] py-3"
                onPress={handleAllocateToGoal}
              >
                <Text variant="body" className="text-white text-[15px] font-semibold">Allocate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={addModalVisible} onRequestClose={closeAddModal}>
        <View className="flex-1 items-center justify-center bg-black/35 px-6">
          <View className="w-full rounded-3xl bg-white p-5">
            {!selectedKind ? (
              <>
                <Text variant="h3" className="mb-4 text-black text-[20px]">Add Entry</Text>
                <TouchableOpacity className="mb-3 flex-row items-center gap-3 rounded-full border border-black/10 bg-[#F8F8F8] px-6 py-4" onPress={() => setSelectedKind('income')}>
                  <Ionicons name="arrow-up" size={20} color="#1A1A1A" />
                  <Text variant="body" className="text-black text-[18px] font-semibold">Income</Text>
                </TouchableOpacity>
                <TouchableOpacity className="mb-3 flex-row items-center gap-3 rounded-full border border-black/10 bg-[#F8F8F8] px-6 py-4" onPress={() => setSelectedKind('autopay')}>
                  <Ionicons name="reload" size={20} color="#1A1A1A" />
                  <Text variant="body" className="text-black text-[18px] font-semibold">Autopay</Text>
                </TouchableOpacity>
                <TouchableOpacity className="mb-4 flex-row items-center gap-3 rounded-full border border-black/10 bg-[#F8F8F8] px-6 py-4" onPress={() => setSelectedKind('expense')}>
                  <Ionicons name="arrow-down" size={20} color="#1A1A1A" />
                  <Text variant="body" className="text-black text-[18px] font-semibold">Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity className="items-center py-1" onPress={closeAddModal}>
                  <Text variant="body" className="text-black/60 text-[16px]">Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text variant="h3" className="mb-4 text-black text-[20px]">New {selectedKind.charAt(0).toUpperCase() + selectedKind.slice(1)}</Text>
                <TextInput value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor="rgba(0,0,0,0.35)" className="mb-3 rounded-xl border border-black/10 bg-[#F7F7F7] px-4 py-3 text-[15px] text-black" />
                <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="Amount" placeholderTextColor="rgba(0,0,0,0.35)" className="mb-3 rounded-xl border border-black/10 bg-[#F7F7F7] px-4 py-3 text-[15px] text-black" />
                {selectedKind !== 'autopay' ? (
                  <TextInput value={category} onChangeText={setCategory} placeholder="Category" placeholderTextColor="rgba(0,0,0,0.35)" className="mb-3 rounded-xl border border-black/10 bg-[#F7F7F7] px-4 py-3 text-[15px] text-black" />
                ) : (
                  <View className="mb-3 rounded-xl border border-black/10 bg-[#F7F7F7] p-3">
                    <Text variant="caption" className="mb-2 text-black/55 text-[12px]">Cadence</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {(Object.keys(cadenceLabels) as AutoPayCadence[]).map((cadence) => (
                        <TouchableOpacity
                          key={cadence}
                          onPress={() => setAutopayCadence(cadence)}
                          className={`rounded-full px-3 py-1 ${autopayCadence === cadence ? 'bg-[#2E7CFF]' : 'bg-white border border-black/15'}`}
                        >
                          <Text variant="caption" className={`${autopayCadence === cadence ? 'text-white' : 'text-black'} text-[12px] font-semibold`}>
                            {cadenceLabels[cadence]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                <TextInput value={entryDate} onChangeText={setEntryDate} placeholder="YYYY-MM-DD" placeholderTextColor="rgba(0,0,0,0.35)" className="mb-4 rounded-xl border border-black/10 bg-[#F7F7F7] px-4 py-3 text-[15px] text-black" />
                <View className="flex-row gap-2">
                  <TouchableOpacity className="flex-1 items-center rounded-xl bg-[#E9E9E9] py-3" onPress={closeAddModal}>
                    <Text variant="body" className="text-black text-[15px]">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-1 items-center rounded-xl bg-[#2E7CFF] py-3" onPress={handleSaveEntry}>
                    <Text variant="body" className="text-white text-[15px] font-semibold">Save</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={budgetModalVisible} onRequestClose={() => setBudgetModalVisible(false)}>
        <View className="flex-1 items-center justify-center bg-black/35 px-6">
          <View className="w-full rounded-3xl bg-white p-5">
            <Text variant="h3" className="mb-4 text-black text-[20px]">Set Monthly Budget</Text>
            <TextInput value={budgetAmount} onChangeText={setBudgetAmount} keyboardType="decimal-pad" placeholder="Budget amount" placeholderTextColor="rgba(0,0,0,0.35)" className="mb-3 rounded-xl border border-black/10 bg-[#F7F7F7] px-4 py-3 text-[15px] text-black" />
            <TextInput value={budgetMonth} onChangeText={setBudgetMonth} placeholder="YYYY-MM" placeholderTextColor="rgba(0,0,0,0.35)" className="mb-4 rounded-xl border border-black/10 bg-[#F7F7F7] px-4 py-3 text-[15px] text-black" />
            <View className="flex-row gap-2">
              <TouchableOpacity className="flex-1 items-center rounded-xl bg-[#E9E9E9] py-3" onPress={() => setBudgetModalVisible(false)}>
                <Text variant="body" className="text-black text-[15px]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 items-center rounded-xl bg-[#2E7CFF] py-3" onPress={handleSaveBudget}>
                <Text variant="body" className="text-white text-[15px] font-semibold">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={goalModalVisible} onRequestClose={() => setGoalModalVisible(false)}>
        <View className="flex-1 items-center justify-center bg-black/35 px-6">
          <View className="w-full rounded-3xl bg-white p-5">
            <Text variant="h3" className="mb-4 text-black text-[20px]">Add Goal</Text>
            <TextInput value={goalName} onChangeText={setGoalName} placeholder="Goal name" placeholderTextColor="rgba(0,0,0,0.35)" className="mb-3 rounded-xl border border-black/10 bg-[#F7F7F7] px-4 py-3 text-[15px] text-black" />
            <TextInput value={goalCurrent} onChangeText={setGoalCurrent} keyboardType="decimal-pad" placeholder="Current amount" placeholderTextColor="rgba(0,0,0,0.35)" className="mb-3 rounded-xl border border-black/10 bg-[#F7F7F7] px-4 py-3 text-[15px] text-black" />
            <TextInput value={goalTarget} onChangeText={setGoalTarget} keyboardType="decimal-pad" placeholder="Target amount" placeholderTextColor="rgba(0,0,0,0.35)" className="mb-3 rounded-xl border border-black/10 bg-[#F7F7F7] px-4 py-3 text-[15px] text-black" />
            <TextInput value={goalDate} onChangeText={setGoalDate} placeholder="Target date YYYY-MM-DD" placeholderTextColor="rgba(0,0,0,0.35)" className="mb-4 rounded-xl border border-black/10 bg-[#F7F7F7] px-4 py-3 text-[15px] text-black" />
            <View className="flex-row gap-2">
              <TouchableOpacity className="flex-1 items-center rounded-xl bg-[#E9E9E9] py-3" onPress={() => setGoalModalVisible(false)}>
                <Text variant="body" className="text-black text-[15px]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 items-center rounded-xl bg-[#2E7CFF] py-3" onPress={handleSaveGoal}>
                <Text variant="body" className="text-white text-[15px] font-semibold">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
