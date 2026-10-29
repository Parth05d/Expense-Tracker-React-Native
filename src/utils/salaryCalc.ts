import { UserSettings, CustomSalaryEvent } from '../types';

export interface SalaryInfo {
  nextPayDate: Date;
  nextPayDateIso: string;
  daysUntilPayday: number;
  expectedAmount: number;
  payCycle: 'monthly' | 'biweekly' | 'weekly' | 'custom';
  formattedCountdown: string;
  isTodayPayday: boolean;
}

export function calculateNextSalaryInfo(
  settings: UserSettings,
  currentDate: Date = new Date()
): SalaryInfo {
  const payCycle = settings.payCycle || settings.paycheckFrequency || 'monthly';
  const baseIncome = settings.monthlyIncomeTarget || settings.monthlyIncome || 50000;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayDateNum = currentDate.getDate();

  let nextPayDate = new Date(currentDate);
  let expectedAmount = baseIncome;

  if (payCycle === 'monthly') {
    const salaryDay = Math.min(31, Math.max(1, settings.salaryDayOfMonth || 1));
    if (todayDateNum <= salaryDay) {
      nextPayDate = new Date(year, month, salaryDay);
    } else {
      nextPayDate = new Date(year, month + 1, salaryDay);
    }
    expectedAmount = baseIncome;
  } else if (payCycle === 'biweekly') {
    const day1 = Math.min(31, Math.max(1, settings.salaryDayOfMonth || 1));
    const day2 = Math.min(31, Math.max(1, settings.salaryDayOfMonth2 || 15));
    const firstDay = Math.min(day1, day2);
    const secondDay = Math.max(day1, day2);

    if (todayDateNum <= firstDay) {
      nextPayDate = new Date(year, month, firstDay);
    } else if (todayDateNum <= secondDay) {
      nextPayDate = new Date(year, month, secondDay);
    } else {
      nextPayDate = new Date(year, month + 1, firstDay);
    }
    expectedAmount = Math.round(baseIncome / 2);
  } else if (payCycle === 'weekly') {
    const targetDayOfWeek = settings.salaryDayOfWeek !== undefined ? settings.salaryDayOfWeek : 5; // Friday default
    const currentDayOfWeek = currentDate.getDay();
    let daysToAdd = (targetDayOfWeek - currentDayOfWeek + 7) % 7;
    
    // If today is payday, keep today or if past time move to next week
    nextPayDate = new Date(currentDate);
    nextPayDate.setDate(currentDate.getDate() + daysToAdd);
    expectedAmount = Math.round(baseIncome / 4.33);
  } else if (payCycle === 'custom') {
    const customEvents = settings.customSalaryEvents || [];
    const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(todayDateNum).padStart(2, '0')}`;
    
    const upcoming = customEvents
      .filter((e) => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (upcoming.length > 0) {
      const nextEvt = upcoming[0];
      const [eYear, eMonth, eDay] = nextEvt.date.split('-').map(Number);
      nextPayDate = new Date(eYear, eMonth - 1, eDay);
      expectedAmount = nextEvt.amount;
    } else {
      // Default fallback if no custom dates set
      nextPayDate = new Date(year, month + 1, 1);
      expectedAmount = baseIncome;
    }
  }

  // Calculate Difference in Days
  const diffTime = nextPayDate.getTime() - currentDate.getTime();
  const daysUntilPayday = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const isTodayPayday = daysUntilPayday === 0;

  const nextPayDateIso = `${nextPayDate.getFullYear()}-${String(nextPayDate.getMonth() + 1).padStart(2, '0')}-${String(nextPayDate.getDate()).padStart(2, '0')}`;

  let formattedCountdown = '';
  if (isTodayPayday) {
    formattedCountdown = '🎉 Today is Payday!';
  } else if (daysUntilPayday === 1) {
    formattedCountdown = 'Tomorrow is Payday!';
  } else {
    formattedCountdown = `Payday in ${daysUntilPayday} days`;
  }

  return {
    nextPayDate,
    nextPayDateIso,
    daysUntilPayday,
    expectedAmount,
    payCycle,
    formattedCountdown,
    isTodayPayday,
  };
}
