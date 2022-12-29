export default `
  query listPurchasesQuery (
    $first: Int
    $type: PurchaseType
    $fromDate: Date
    $after: String
  ) {
    listPurchases(
      first: $first,
      type: $type,
      after: $after,
      dateRanges: { after: $fromDate, dateField: addedDate }
    ) {
      purchasesCount
      pageInfo {
        hasNextPage
        endCursor
      }
      purchases {
        userId
        status
        startDate
        contentId
        plan {
          name
        }
      }
    }
  }
`;
