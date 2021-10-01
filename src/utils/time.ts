import { TIME } from '../constants';

export const minsIntoHumanTime = (mins: number) => {
  const hoursIntoDay = Math.floor(mins / TIME.MINS_IN_HOUR);
  const minsIntoHour = Math.floor(mins % TIME.MINS_IN_HOUR);

  return `${hoursIntoDay < 10 ? '0' : ''}${hoursIntoDay}:${
    minsIntoHour < 10 ? '0' : ''
  }${minsIntoHour}`;
};

/** Eg 17:39 => hours: 17 mins: 39 */
export const humanTimeIntoMins = (hours: number, mins: number) => {
  return hours * TIME.MINS_IN_HOUR + mins;
};

/**
 * Convert from ISO days (1 indexed where 1 is Monday) to
 * 0-indexed days where 0 is Sunday and 6 is Saturday.
 *
 * Used for converting day numerals from Luxon to native Date.
 */
export const toZeroIndexedDays = (day: number) => day % 7;
