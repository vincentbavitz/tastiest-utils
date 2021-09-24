export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

// Minutes into day starting at 00:00. Example: 79 --> 01:19
export type TimeRange = [number, number];
export type QuietTimesMetricDay = {
  active: boolean;
  range: TimeRange;
  coversRequired: number; // number of covers required during quiet times
};

export type OpenTimesMetricDay = {
  open: boolean;
  range: TimeRange;
};

/** Keys are derived from DayOfWeek where SUNDAY = 0.
 *  Range is defined in minutes from midnight.
 */
export type WeekQuietTimes = {
  [DayOfWeek.SUNDAY]: QuietTimesMetricDay;
  [DayOfWeek.MONDAY]: QuietTimesMetricDay;
  [DayOfWeek.TUESDAY]: QuietTimesMetricDay;
  [DayOfWeek.WEDNESDAY]: QuietTimesMetricDay;
  [DayOfWeek.THURSDAY]: QuietTimesMetricDay;
  [DayOfWeek.FRIDAY]: QuietTimesMetricDay;
  [DayOfWeek.SATURDAY]: QuietTimesMetricDay;
};

export type WeekOpenTimes = {
  [DayOfWeek.SUNDAY]: OpenTimesMetricDay;
  [DayOfWeek.MONDAY]: OpenTimesMetricDay;
  [DayOfWeek.TUESDAY]: OpenTimesMetricDay;
  [DayOfWeek.WEDNESDAY]: OpenTimesMetricDay;
  [DayOfWeek.THURSDAY]: OpenTimesMetricDay;
  [DayOfWeek.FRIDAY]: OpenTimesMetricDay;
  [DayOfWeek.SATURDAY]: OpenTimesMetricDay;
};
