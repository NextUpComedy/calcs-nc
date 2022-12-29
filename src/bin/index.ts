import {
  getDashboardSettings,
  ContentReportWatchesAssociation,
  Report,
  sequelize,
  Content,
  User,
  ContentReport,
} from 'db-models-nc';
import Big from 'big.js';
import {
  min, max, differenceInDays, addYears,
} from 'date-fns';
import { IRevenueCalculator } from 'src/interfaces';
import {
  viewliftLogin,
  listUserWatched,
  CustomError,
  watchesPerContent,
  getAllPayments,
  logger,
  getUsersAsAnObject,
  calculateReportRevenue,
  CONSTANTS,
} from '../utilities';

(async (): Promise<void> => {
  const transaction = await sequelize.transaction();
  const { stripeResultsLimit } = CONSTANTS;
  let revenueCalculator:IRevenueCalculator = { totalRevenue: 0 };
  try {
    await sequelize.authenticate();
    logger.info('Connected to Database Successfully');
    const {
      email,
      expiredAfterInYears,
      limit,
      maxCount,
      nextUpToOwedSplitPercentage,
      password,
      viewliftEndpoint,
      stripeKey,
    } = await getDashboardSettings();

    const lastReport = await Report?.findOne({ order: [['id', 'DESC']] });

    if (!lastReport || lastReport.overallWatchedSeconds) {
      logger.info('No pending reports to distribute its revenue');
      await transaction.commit();
      sequelize.close();
      return;
    }
    revenueCalculator = {
      totalRevenue: lastReport.totalRevenue || 0,
    };
    const {
      watchTimeFrom,
      watchTimeTo,
      id: reportId,
    } = lastReport;
    console.log({
      watchTimeFrom,
      watchTimeTo,
    });

    if (!lastReport.totalRevenue) {
      revenueCalculator = calculateReportRevenue({
        watchTimeFrom,
        watchTimeTo,
        stripeKey,
        stripeResultsLimit,
        maxNetworkRetries: maxCount,
        lastReport,
      });
    }
    logger.info(`Fetched the last report ended at : ${watchTimeFrom}`);
    const findAllDatabaseContents = Content.findAll({ transaction });
    const getUsersObj = getUsersAsAnObject();
    const { Authorization } = await viewliftLogin({
      email,
      password,
      viewliftEndpoint,
    });

    logger.info('Logged in to ViewLift API');
    logger.info('Fetching data from ViewLift API will take a while please be patient...');

    const { watchedStreams } = await listUserWatched({
      Authorization,
      viewliftEndpoint,
      maxCount,
      limit,
      watchTimeFrom,
      watchTimeTo,
    });
    const { paymentsList } = await getAllPayments({
      Authorization,
      viewliftEndpoint,
      after: watchTimeFrom,
      limit,
    });

    const databaseContents = await findAllDatabaseContents;
    logger.info('Restructuring ViewLift data...');
    const {
      contentReports,
      overallWatchedSeconds,
      contents,
    } = watchesPerContent(
      watchedStreams.filter(({ user, content }) => user && content && content?.type === 'video'),
      paymentsList,
      databaseContents,
    );
    const usersObj = await getUsersObj;
    logger.info('Calculating revenue for each content...');
    const { totalRevenue } = await revenueCalculator;
    lastReport.totalRevenue = totalRevenue;
    const calcContentReports = contentReports.map(({
      contentId,
      watchedSeconds,
      watches,
      createdBy,
      updatedBy,
      title,
      tvodTicketsCount,
      tvodSeconds,
    }) => {
      const revenue: Big = (new Big(totalRevenue))
        .times((watchedSeconds - tvodSeconds)).div(overallWatchedSeconds);
      const nextupRevenue:Big = revenue.times(nextUpToOwedSplitPercentage);
      const remaingRevenue:Big = revenue.minus(nextupRevenue);

      const {
        launchDate, userId, recoveredCosts, feePaid, filmingCosts, advance,
      } = contents[contentId];

      if (userId) {
        if (!(launchDate && recoveredCosts && feePaid && filmingCosts && advance)) throw new CustomError('error: ', 'matched users should have launchDate, recoveredCosts, feePaid, filmingCosts');
        const toDate = new Date(watchTimeTo);
        const fromDate = new Date(watchTimeFrom);
        const expDate = addYears(new Date(launchDate), expiredAfterInYears);
        const markPointDate = max([min([expDate, toDate]), fromDate]);
        const beforeExpiryReportDaysPercentage = new Big(1)
          .times(differenceInDays(markPointDate, fromDate))
          .div(differenceInDays(toDate, fromDate));
        const beforeExpRevenue = beforeExpiryReportDaysPercentage.times(remaingRevenue);
        const afterExpRevenue = new Big(remaingRevenue).minus(beforeExpRevenue);
        let owedRevenue = afterExpRevenue;
        const remainingCosts = new Big(filmingCosts)
          .plus(feePaid).plus(advance).minus(recoveredCosts);// >=0
        let shareableBeforeExpRevenue = beforeExpRevenue;
        if (remainingCosts.gt(0)) {
          shareableBeforeExpRevenue = shareableBeforeExpRevenue.minus(remainingCosts);
          if (shareableBeforeExpRevenue.lt(0)) {
            shareableBeforeExpRevenue = new Big(0);
          }
        }
        const reimbursementBeforeExpRevenue = beforeExpRevenue
          .minus(shareableBeforeExpRevenue).toString();
        owedRevenue = owedRevenue
          .plus(shareableBeforeExpRevenue);

        contents[contentId].nextUpAccRevenue = nextupRevenue
          .plus(contents[contentId].nextUpAccRevenue).toString();

        contents[contentId].owedAccRevenue = owedRevenue
          .plus(contents[contentId].owedAccRevenue).toString();
        contents[contentId].recoveredCosts = beforeExpRevenue
          .minus(shareableBeforeExpRevenue).plus(recoveredCosts).toString();
        usersObj[userId].totalRevenue = owedRevenue.plus(usersObj[userId].totalRevenue);
        return ({
          contentId,
          watchedSeconds,
          watches,
          revenue,
          createdBy,
          updatedBy,
          title,
          tvodTicketsCount,
          tvodSeconds,
          nextupRevenue,
          owedRevenue,
          beforeExpiryReportDaysPercentage,
          beforeExpRevenue,
          splittableBeforeExpRevenue: shareableBeforeExpRevenue,
          reimbursementBeforeExpRevenue,
          afterExpRevenue,
          reportId,
        }
        );
      }

      return ({
        contentId,
        watchedSeconds,
        watches,
        revenue,
        createdBy,
        updatedBy,
        title,
        tvodTicketsCount,
        tvodSeconds,
        reportId,
      }
      );
    });

    logger.info('Seeding Database tables...');
    await Content.bulkCreate(Object.values(contents), { transaction, updateOnDuplicate: ['nextUpAccRevenue', 'owedAccRevenue', 'recoveredCosts'] });
    lastReport.overallWatchedSeconds = overallWatchedSeconds;
    await lastReport.save({ transaction });
    await ContentReport.bulkCreate(calcContentReports, {
      include: [{
        association: ContentReportWatchesAssociation,
      }],
      transaction,
    });
    await User.bulkCreate(Object.values(usersObj), { updateOnDuplicate: ['totalRevenue'] });
    await transaction.commit();
    logger.info('-----------------------------');
    logger.info('DATABASE UPDATED SUCCESSFULLY');
    sequelize.close();
  } catch (err) {
    await transaction.rollback();
    try {
      const { totalRevenue, lastReport } = await revenueCalculator;
      if (!lastReport) {
        logger.error(err);
        return;
      }
      lastReport.totalRevenue = totalRevenue;
      await lastReport.save();
      logger.info('Report revenue Calculated and updated succesfully');
      logger.error(err);
    } catch (err2) {
      logger.error(err2);
    }
  }
})();
