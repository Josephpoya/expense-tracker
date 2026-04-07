// NOTE: expo-notifications was removed from Expo Go in SDK 53.
// These functions are safely stubbed so the app works in Expo Go.
// To re-enable real push notifications, create a development build:
//   eas build --profile development --platform android

export async function registerForPushNotifications(): Promise<string | null> {
  console.log('[Notifications] Push notifications require a development build (not supported in Expo Go SDK 53+).');
  return null;
}

export async function scheduleBudgetNotification(
  categoryName: string,
  percentageSpent: number,
  currencySymbol: string,
  remaining: number,
  isExceeded: boolean
) {
  // Stubbed - logs to console instead of firing a real notification
  const title = isExceeded
    ? `🚨 Budget Exceeded: ${categoryName}`
    : `⚠️ Budget Alert: ${categoryName}`;
  const body = isExceeded
    ? `You have exceeded your ${categoryName} budget!`
    : `You've used ${percentageSpent.toFixed(0)}% of your ${categoryName} budget. ${currencySymbol}${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })} remaining.`;
  console.log(`[Notifications] ${title} - ${body}`);
}

export async function checkBudgetsAndNotify(
  budgets: any[],
  currencySymbol: string,
  notifiedRef: Set<string>
) {
  for (const budget of budgets) {
    const pct = budget.percentage_spent || 0;
    const threshold = budget.alert_threshold || 80;
    const key = `${budget.id}-${budget.is_exceeded ? 'exceeded' : pct >= threshold ? 'warning' : 'ok'}`;
    if (notifiedRef.has(key)) continue;
    if (budget.is_exceeded || pct >= threshold) {
      await scheduleBudgetNotification(
        budget.category_name || `Budget #${budget.id}`,
        pct,
        currencySymbol,
        budget.remaining_amount || 0,
        budget.is_exceeded
      );
      notifiedRef.add(key);
    }
  }
}
