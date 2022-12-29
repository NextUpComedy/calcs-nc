export default `
  query listPaymentsQuery (
    $limit: Int
    $offset: Int
    $after: Date
  ) {
    listPayments (
      offset: $offset
      limit: $limit
      dateRanges: { after: $after, dateField: loadtime }
    ) {
      billingHistory {
        contentId
        monetizationModel
        type
      }
    }
  }
`;
