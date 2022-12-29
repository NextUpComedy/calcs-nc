export interface ListUserWatchedDTO {
  Authorization: string,
  viewliftEndpoint: string,
  maxCount: number,
  counter?: number,
  offset?: number,
  limit: number,
  watchTimeFrom: string,
  watchTimeTo: string,
}
