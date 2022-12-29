import axios from 'axios';
import { ListUserWatchedDTO } from '../../../dto/watches.dto';
import { IListUserWatched, IListUserWatchedReturn, IWatchedStream } from '../../../interfaces';
import { listUserWatchedQuery } from '../gqlQueries';
import CustomError from '../../CustomError';
import { logger } from '../..';

const getAllWatches = async (
  listUserWatchedData: ListUserWatchedDTO,
): Promise<IListUserWatchedReturn> => {
  let watchesList: IWatchedStream[] = [];
  let allWatchesCount = 0;
  const listUserWatched = async (
    {
      Authorization,
      viewliftEndpoint,
      offset = 0,
      limit,
      watchTimeFrom,
      watchTimeTo,
    }: IListUserWatched,
  ): Promise<IListUserWatchedReturn> => {
    try {
      const { data: { data: { listUserWatched: { totalCount, watchedStreams } } } } = await axios
        .post(viewliftEndpoint, {
          query: listUserWatchedQuery,
          variables: {
            watchTimeFrom,
            watchTimeTo,
            limit,
            offset,
          },
        }, {
          headers: {
            Authorization,
          },
        });

      let counter = listUserWatchedData.counter || 0;
      const { maxCount } = listUserWatchedData;

      allWatchesCount = totalCount;
      watchesList = [...watchesList, ...watchedStreams];
      if (totalCount > offset + limit) {
        logger.warn(`  - Fetched ${offset + limit} watch data from ${totalCount} total watches`);
        await listUserWatched({
          watchTimeFrom,
          watchTimeTo,
          limit,
          offset: offset + limit,
          Authorization,
          viewliftEndpoint,
        });
      } else {
        logger.warn(`  - Fetched ${totalCount} watch data from ${totalCount} total watches`);
      }

      const isTotalMatch = totalCount === watchesList.length;
      if (!isTotalMatch) {
        if (counter < 10) {
          counter += 1;
          return await getAllWatches({
            counter,
            maxCount,
            Authorization,
            viewliftEndpoint,
            limit,
            offset: 0,
            watchTimeFrom,
            watchTimeTo,
          });
        }
        throw new Error('trails limit exceeded');
      }

      return {
        totalCount,
        watchedStreams: watchesList,
      };
    } catch (err) {
      if (err instanceof Error) {
        throw new CustomError(err.message, 'In getWatches Function');
      }
      throw err;
    }
  };

  await listUserWatched(listUserWatchedData);
  return {
    totalCount: allWatchesCount,
    watchedStreams: watchesList,
  };
};

export default getAllWatches;
