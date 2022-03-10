export enum FollowerNotificationType {
  LIMITED_TIME_DISHES = 'LIMITED_TIME_DISHES',
  SPECIAL_EXPERIENCES = 'SPECIAL_EXPERIENCES',
  LAST_MINUTE_TABLES = 'LAST_MINUTE_TABLES',
  GENERAL_INFO = 'GENERAL_INFO',
  NEW_MENU = 'NEW_MENU',
}

export type FollowerNotificationPreferences = {
  [FollowerNotificationType.LIMITED_TIME_DISHES]: boolean;
  [FollowerNotificationType.SPECIAL_EXPERIENCES]: boolean;
  [FollowerNotificationType.LAST_MINUTE_TABLES]: boolean;
  [FollowerNotificationType.GENERAL_INFO]: boolean;
  [FollowerNotificationType.NEW_MENU]: boolean;
};

// export interface RestaurantEmail {
//   templates: { [id: string]: EmailTemplate };
//   sent: Email[];
// }
