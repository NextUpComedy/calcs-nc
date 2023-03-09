export interface ListPaymentsDTO {
  Authorization: string,
  uScreenEndpoint: string,
  offset?: number,
  limit: number,
  after: string,
}
