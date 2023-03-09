import Stripe from 'stripe';
import { addMonths, subMonths } from 'date-fns';
import { IReport } from 'nc-db-new';
import constants from '../constants';

const getMayAffectReportRevenueCharges = async (
  {
    watchTimeFrom,
    watchTimeTo,
    stripeKey,
    maxNetworkRetries,
    limit,
  }:
  {
    watchTimeFrom:string,
    watchTimeTo:string,
    stripeKey:string
    maxNetworkRetries:number,
    limit:number,
  },
):Promise<{ totalCharges:Stripe.Charge[] }> => {
  const stripe = new Stripe(stripeKey, { typescript: true, apiVersion: '2022-08-01', maxNetworkRetries });
  const lt = (new Date(watchTimeTo)).valueOf() / 1000;

  const gte = subMonths(new Date(watchTimeFrom), 13).valueOf() / 1000;
  let totalCharges:Stripe.Charge[] = [];
  const getChargesList = async (id?:string):Promise<void> => {
    const charges = await stripe.charges.list({
      limit,
      created: {
        lt,
        gte,
      },
      starting_after: id,
    });
    if (charges.has_more) {
      totalCharges = [...totalCharges, ...charges.data];
      const lastIndexCharge = charges.data.pop();
      if (!lastIndexCharge) throw new Error();
      await getChargesList(lastIndexCharge.id);
    }
  };
  await getChargesList();
  return { totalCharges };
};

const getMayAffectReportRevenueBalanceTransactions = async (
  {
    watchTimeFrom,
    watchTimeTo,
    stripeKey,
    maxNetworkRetries,
    limit,
  }:
  {
    watchTimeFrom:string,
    watchTimeTo:string,
    stripeKey:string
    maxNetworkRetries:number,
    limit:number,
  },
):Promise<{ totalBalanceTransactions: Stripe.BalanceTransaction[] }> => {
  const stripe = new Stripe(stripeKey, { typescript: true, apiVersion: '2022-08-01', maxNetworkRetries });

  const lt = (new Date(watchTimeTo)).valueOf() / 1000;

  const gte = subMonths(new Date(watchTimeFrom), 13).valueOf() / 1000;

  let totalBalanceTransactions: Stripe.BalanceTransaction[] = [];
  const getBalanceTransactionList = async (id?:string):Promise<void> => {
    const balanceTransactions = await stripe.balanceTransactions.list({
      limit,
      created: {
        lt,
        gte,
      },
      starting_after: id,
    });
    if (balanceTransactions.has_more) {
      totalBalanceTransactions = [...totalBalanceTransactions, ...balanceTransactions.data];
      const lastIndexbalanceTransaction = balanceTransactions.data.pop();
      if (!lastIndexbalanceTransaction) throw new Error();
      await getBalanceTransactionList(lastIndexbalanceTransaction.id);
    }
  };
  await getBalanceTransactionList();
  return { totalBalanceTransactions };
};

const calculateReportRevenue = async (
  {
    watchTimeFrom,
    watchTimeTo,
    stripeKey,
    maxNetworkRetries,
    stripeResultsLimit,
    lastReport,
  }:
  {
    watchTimeFrom:string,
    watchTimeTo:string,
    stripeKey:string
    maxNetworkRetries:number,
    stripeResultsLimit:number,
    lastReport:IReport
  },
):Promise<{ totalRevenue:number, lastReport:IReport }> => {
  console.log('start');
  const limit = stripeResultsLimit;
  const [
    { totalCharges },
    { totalBalanceTransactions }] = await Promise.all([
    getMayAffectReportRevenueCharges({
      watchTimeTo, watchTimeFrom, stripeKey, maxNetworkRetries, limit,
    }),
    getMayAffectReportRevenueBalanceTransactions({
      watchTimeTo, watchTimeFrom, stripeKey, maxNetworkRetries, limit,
    }),
  ]);
  const start = subMonths(new Date(watchTimeFrom), 12).valueOf() / 1000;

  const { GB_AND_EU, plans } = constants;
  const fromDateValue = (new Date(watchTimeFrom)).valueOf() / 1000;
  const toDateValue = (new Date(watchTimeTo)).valueOf() / 1000;
  const chargesReportRevenuePercentage:{ [key:string]:number } = {};
  const chargesReportCreated:{ [key:string]:number } = {};

  totalCharges.forEach(({
    id, paid, created, refunded, metadata: { planId }, payment_method_details, billing_details,
  }) => {
    const country = payment_method_details?.card?.country || billing_details?.address?.country;
    const remaningAfterTax = (country && GB_AND_EU[country]) ? 0.8 : 1;
    if (paid && !refunded) {
      let durationRevenuePercentage = remaningAfterTax;
      if (planId) {
        const subscribtionEndDate = addMonths(new Date(created * 1000), plans[planId] || 1);
        const endDateValue = subscribtionEndDate.valueOf() / 1000;
        const intersectionStart = Math.max(created, fromDateValue);
        const intersectionEnd = Math.min(endDateValue, toDateValue);
        const intersectionDuration = intersectionEnd - intersectionStart;
        const intersectionCoverage = intersectionDuration > 0 ? intersectionDuration : 0;
        durationRevenuePercentage = (durationRevenuePercentage
         * (intersectionCoverage)) / (endDateValue - created);
        chargesReportRevenuePercentage[id] = durationRevenuePercentage;
      }
    }
    chargesReportCreated[id] = created;
  });
  let totalRevenue = 0;
  totalBalanceTransactions.forEach(({
    amount: net,
    source,
    created,
  }) => {
    if (chargesReportCreated[source as string]) {
      if (chargesReportRevenuePercentage[source as string]) {
        totalRevenue += net * chargesReportRevenuePercentage[source as string];
      }
    } else if (net > 0 && created > start) {
      // waiting for jason reply
    //   totalRevenue += net / 12;
    }
  });
  totalRevenue /= 100;

  return { totalRevenue, lastReport };
};

export {
  calculateReportRevenue,
  getMayAffectReportRevenueCharges,
  getMayAffectReportRevenueBalanceTransactions,
};
