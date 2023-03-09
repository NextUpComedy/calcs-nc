import { IContent } from 'nc-db-new';
import { WPCOutputDTO, ContentDTO } from '../dto/content.dto';
import {
  IAccumulatedWatchesDurationPerContent, IWatchedStream, IPayment, ISysContent,
} from '../interfaces';
import CONSTANTS from './constants';

const watchesPerContent = (
  watchedStreams: IWatchedStream[],
  paymentsList: IPayment[],
  databaseContent: IContent[],
):
WPCOutputDTO => {
  let overallWatchedSeconds = 0;
  // Objects Storage
  const runtimes: { [key: string]: number } = {};
  const tvodCount:{ [key: string]:number } = {};
  const contents:{ [key: string]: ISysContent } = {};
  const accumulatedWatchesDurationPerContent: {
    [key: string]: IAccumulatedWatchesDurationPerContent
  } = {};

  paymentsList.forEach(({ contentId, monetizationModel, type }) => {
    if (monetizationModel === CONSTANTS.MONETIZATION_MODEL) {
      if (tvodCount[contentId]) {
        tvodCount[contentId] = type === CONSTANTS.BILLING_TYPE
          ? tvodCount[contentId] + 1
          : tvodCount[contentId] - 1;
      } else {
        tvodCount[contentId] = type === CONSTANTS.BILLING_TYPE ? 1 : -1;
      }
    }
  });

  databaseContent.forEach((content) => {
    const { id } = content;
    if (id) {
      contents[id] = ContentDTO(content);
    }
  });

  watchedStreams.forEach(({
    contentId,
    duration,
    streamId,
    content:
    {
      id,
      publishDate,
      title,
      permalink,
      runtime,
      primaryCategory,
    },
  }) => {
    overallWatchedSeconds += duration;
    runtimes[contentId] = runtime || 3600;

    if (!contents[contentId]) {
      contents[contentId] = {
        id,
        publishDate,
        title,
        permalink,
        runtime,
        nextUpAccRevenue: '0',
        owedAccRevenue: '0',
        recoveredCosts: '0',
        primaryCategory: primaryCategory?.title,
        createdBy: CONSTANTS.SYSTEM_ID,
        updatedBy: CONSTANTS.SYSTEM_ID,
      };
    }

    if ((accumulatedWatchesDurationPerContent)?.[contentId]) {
      (accumulatedWatchesDurationPerContent)[contentId].watchedSeconds = +duration
       + +(accumulatedWatchesDurationPerContent)[contentId].watchedSeconds;
      (accumulatedWatchesDurationPerContent)[contentId].watches.push(
        {
          streamId,
          duration,
          contentId,
          createdBy: CONSTANTS.SYSTEM_ID,
          updatedBy: CONSTANTS.SYSTEM_ID,
        },
      );
    } else {
      (accumulatedWatchesDurationPerContent)[contentId] = {
        contentId,
        watchedSeconds: duration,
        watches: [{
          contentId,
          streamId,
          duration,
          createdBy: CONSTANTS.SYSTEM_ID,
          updatedBy: CONSTANTS.SYSTEM_ID,

        }],
        revenue: '0', // should be updated in next stage
        createdBy: CONSTANTS.SYSTEM_ID,
        updatedBy: CONSTANTS.SYSTEM_ID,
        title,
        tvodTicketsCount: (tvodCount[contentId] || 0),
        tvodSeconds: (tvodCount[contentId] || 0) * runtimes[contentId],
      };
    }
  });

  return {
    contentReports: Object.values(accumulatedWatchesDurationPerContent),
    overallWatchedSeconds,
    contents,
  };
};

export default watchesPerContent;
