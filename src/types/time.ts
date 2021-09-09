type ArrayLengthMutationKeys = 'splice' | 'push' | 'pop' | 'shift' | 'unshift';
type FixedLengthArray<T, L extends number, TObj = [T, ...Array<T>]> = Pick<
  TObj,
  Exclude<keyof TObj, ArrayLengthMutationKeys>
> & {
  readonly length: L;
  [I: number]: T;
  [Symbol.iterator]: () => IterableIterator<T>;
};

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

/** Keys are derived from DayOfWeek where SUNDAY = 0.
 *  Value represent whether or not the slot is available; 1 | 0.
 *  Since the granularity of slots is 15 minutes, we have 24 * 4 = 96
 *  items in the array, where slots[0] represents 00:00 --> 00:15,
 *  and so on.
 *  For example, to access Friday, 01:30 -> 01:45, it's slots[5][15 * 1 + 2]
 */
export type TimeSlots = FixedLengthArray<0 | 1, 96>;
export type WeekTimeSlots = {
  [DayOfWeek.SUNDAY]: TimeSlots;
  [DayOfWeek.MONDAY]: TimeSlots;
  [DayOfWeek.TUESDAY]: TimeSlots;
  [DayOfWeek.WEDNESDAY]: TimeSlots;
  [DayOfWeek.THURSDAY]: TimeSlots;
  [DayOfWeek.FRIDAY]: TimeSlots;
  [DayOfWeek.SATURDAY]: TimeSlots;
};
