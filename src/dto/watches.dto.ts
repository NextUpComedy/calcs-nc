export interface ListUserWatchedDTO {
  Authorization: string,
  uScreenEndpoint: string,
  maxCount: number,
  counter?: number,
  offset?: number,
  limit: number,
  watchTimeFrom: string,
  watchTimeTo: string,
}
