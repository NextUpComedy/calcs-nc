export interface ListPaymentsDTO {
  Authorization: string,
  viewliftEndpoint: string,
  offset?: number,
  limit: number,
  after: string,
}
