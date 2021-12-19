const TIME = {
  DAYS_OF_THE_WEEK: [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ],
  LOCALES: {
    LONDON: 'Europe/London',
  },
  DAYS_IN_WEEK: 7,
  MINS_IN_HOUR: 60,
  MS_IN_ONE_DAY: 1000 * 60 * 60 * 24,

  /** If any booking-system sync data is older than this, discount it. */
  OLDEST_VIABLE_BOOKING_SYNC_DATA_MINS: 20,
};

export default TIME;
