const listUserWatchedQuery = `query listUserWatched(
  $watchTimeFrom: Date!
  $watchTimeTo: Date!
  $limit: Int!
  $offset: Int
) {
  listUserWatched(
    watchTimeFrom: $watchTimeFrom
    watchTimeTo: $watchTimeTo
    limit: $limit
    offset: $offset
  ) {
    totalCount
    watchedStreams {
      streamId
      contentId
      duration
      content {
        id
        publishDate
        title
        permalink
        type
        ... on Video {
          runtime
          primaryCategory {
            title
          }
          categories {
            title
          }
        }
      }
      user {
        email
        purchases {
          subscription {
            planIdentifier
            offersApplied {
              offerName
            }
          }
        }
      }
    }
  }
}

`;

export default listUserWatchedQuery;
