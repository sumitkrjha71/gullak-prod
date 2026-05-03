// Goal feasibility engine — never red-errors a goal. Always returns a path forward.

export type Feasibility = {
  achievable: boolean;
  monthsAtCurrentPace: number;       // months at the user's current daily save rate
  monthsAtSuggestedPace: number;     // months if user bumped to the suggested rate
  suggestedDailyPaise: number;
  /** True when timeline is tight enough to recommend bridging via credit. */
  recommendCredit: boolean;
};

export function evaluateGoal({
  targetPaise,
  savedPaise,
  currentDailyPaise,
  deadlineDate,
  todayDate = new Date(),
}: {
  targetPaise: number;
  savedPaise: number;
  currentDailyPaise: number;
  deadlineDate: Date | null;
  todayDate?: Date;
}): Feasibility {
  const remaining = Math.max(0, targetPaise - savedPaise);
  if (remaining === 0) {
    return {
      achievable: true,
      monthsAtCurrentPace: 0,
      monthsAtSuggestedPace: 0,
      suggestedDailyPaise: currentDailyPaise,
      recommendCredit: false,
    };
  }

  const monthsAtCurrentPace =
    currentDailyPaise > 0 ? Math.ceil(remaining / (currentDailyPaise * 30)) : Infinity;

  // If a deadline is set, compute the daily rate needed to hit it.
  let neededDaily = currentDailyPaise;
  let achievable = true;
  if (deadlineDate) {
    const daysToDeadline = Math.max(1, Math.ceil((deadlineDate.getTime() - todayDate.getTime()) / 86400000));
    neededDaily = Math.ceil(remaining / daysToDeadline);
    achievable = neededDaily <= currentDailyPaise * 1.5; // Up to 1.5× current pace is "stretchy but achievable"
  }

  const suggestedDailyPaise = Math.max(currentDailyPaise + 5_00, Math.round(neededDaily));
  const monthsAtSuggestedPace =
    suggestedDailyPaise > 0 ? Math.ceil(remaining / (suggestedDailyPaise * 30)) : Infinity;

  // Recommend credit when (a) tight deadline (<60 days) and (b) remaining is large vs current pace.
  const recommendCredit = !!(
    deadlineDate &&
    (deadlineDate.getTime() - todayDate.getTime()) / 86400000 < 60 &&
    currentDailyPaise > 0 &&
    remaining > currentDailyPaise * 60
  );

  return {
    achievable,
    monthsAtCurrentPace: monthsAtCurrentPace === Infinity ? -1 : monthsAtCurrentPace,
    monthsAtSuggestedPace: monthsAtSuggestedPace === Infinity ? -1 : monthsAtSuggestedPace,
    suggestedDailyPaise,
    recommendCredit,
  };
}
