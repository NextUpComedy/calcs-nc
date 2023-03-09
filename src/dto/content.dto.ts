import { IContent } from 'nc-db-new';

import {
  ISysContent, IWatchedStream, IPayment,
  IAccumulatedWatchesDurationPerContent,
  IWatchedStreamsPerContent,
} from '../interfaces';

const ContentDTO = (data: IContent): ISysContent => ({
  id: data.id,
  userId: data.userId,
  title: data.title,
  publishDate: data.publishDate,
  permalink: data.permalink,
  launchDate: data.launchDate,
  primaryCategory: data.primaryCategory,
  updatedBy: data.updatedBy,
  createdBy: data.createdBy,
  runtime: data.runtime,
  advance: data.advance,
  feePaid: data.feePaid,
  filmingCosts: data.filmingCosts,
  nextUpAccRevenue: data.nextUpAccRevenue,
  owedAccRevenue: data.owedAccRevenue,
  recoveredCosts: data.recoveredCosts,
});

// Watches Per Content
export interface WPCInputDTO {
  watchedStreams: IWatchedStream[];
  paymentsList: IPayment,
  databaseContent: IContent,
}

export interface WPCOutputDTO {
  contentReports: IAccumulatedWatchesDurationPerContent[],
  overallWatchedSeconds: number,
  contents: { [key: string]: ISysContent },
}

const WatchedStreamsDTO = (input: IWatchedStreamsPerContent): IWatchedStreamsPerContent => ({
  contentId: input.contentId,
  duration: input.duration,
  streamId: input.streamId,
  content:
  {
    id: input.content.id,
    publishDate: input.content.publishDate,
    title: input.content.title,
    permalink: input.content.permalink,
    runtime: input.content.runtime,
    primaryCategory: input.content.primaryCategory,
  },

});

export { ContentDTO, WatchedStreamsDTO };
