import { IReport } from 'nc-db-new';

interface IDatabase {
  DATABASE_URL: string;
}

interface IEmail {
  appMail: string;
  mailPassword: string;
}

interface IViewlift {
  email: string;
  password: string;
  uScreenEndpoint: string;
  limit: number;
  fetchMaxCount: number;
}
interface ISystem {
  ENCRYPTION_SECRET_KEY: string;
}
interface IListUserWatched {
  watchTimeFrom: string;
  watchTimeTo: string;
  limit: number;
  offset?: number;
  Authorization: string;
  uScreenEndpoint: string;
}

interface IBasicContent {
  type?: string;
  id: string;
  userId?: number | null;
  title: string;
  publishDate: number;
  permalink: string;
  nextUpAccRevenue: string;
  owedAccRevenue: string;
  launchDate?: string;
  advance?: string;
  feePaid?: string;
  filmingCosts?: string;
  paidToOwedAmount?: number;
  freeToBePaid?: number;
  createdBy: number;
  updatedBy: number;
  runtime: number;
  recoveredCosts: string;
}

interface IVLContent extends IBasicContent {
  primaryCategory: { title: string };
}
interface ISysContent extends IBasicContent {
  primaryCategory: string ;
}
interface ISubscription {
  planIdentifier: string;
  offersApplied: [];
}

interface IPurchase {
  subscription: ISubscription;
}

interface IVLUser {
  email: string[];
  purchases: IPurchase[];
}

interface IWatchedStream {
  streamId: string;
  contentId: string;
  duration: number;
  content: IVLContent;
  user?: IVLUser;
}

interface IWatchedStreamsPerContent extends Omit<IWatchedStream, 'content'> {
  content: {
    id: string,
    publishDate: number,
    title: string,
    permalink: string,
    runtime: number,
    primaryCategory: { title: string; },
  }
}

interface IListUserWatchedReturn {
  totalCount: number;
  watchedStreams: IWatchedStream[];
}
interface IDbWatches extends Pick<IWatchedStream, 'streamId' | 'contentId' | 'duration'> {
  createdBy: number;
  updatedBy: number;
}
interface IAccumulatedWatchesDurationPerContent {
  contentId: string;
  watchedSeconds: number;
  watches: IDbWatches[];
  revenue: string;
  reportId?: number;
  createdBy: number;
  updatedBy: number;
  tvodTicketsCount: number;
  tvodSeconds: number;
  title?: string;
  nextupRevenue?: string;
  owedRevenue?: string;
  beforeExpiryReportDaysPercentage?:string;
  beforeExpRevenue?:string;
  splittableBeforeExpRevenue?:string;
  reimbursementBeforeExpRevenue?:string;
  afterExpRevenue?:string,
}

interface IPayment {
  contentId: string;
  monetizationModel: 'tvod' | 'svod';
  type: 'PAYMENT' | 'REFUND';
}

type SharedInputs = Omit<IListUserWatched, 'watchTimeFrom' | 'watchTimeTo'>;

interface IListOffsetPayments extends SharedInputs {
  after: string;
}

interface IPurchase {
  userId: string,
  status: string,
  startDate: string,
  contentId: null,
  plan: { name: string }
}

interface IListSlicePurchases {
  Authorization: string;
  uScreenEndpoint: string;
  first: number;
  type: string;
  fromDate: string;
  after: string;
}

interface ILoginResponse {
  Authorization:string
}

type IRevenueCalculator = { totalRevenue:number, lastReport?:IReport } |
Promise<{ totalRevenue:number, lastReport:IReport }>;

export {
  IDatabase,
  IEmail,
  IViewlift,
  IListUserWatched,
  IListUserWatchedReturn,
  IWatchedStream,
  IAccumulatedWatchesDurationPerContent,
  IPayment,
  IListOffsetPayments,
  IPurchase,
  IListSlicePurchases,
  IVLContent,
  ISysContent,
  IWatchedStreamsPerContent,
  ILoginResponse,
  ISystem,
  IRevenueCalculator,
};
