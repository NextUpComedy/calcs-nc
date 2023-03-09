import axios from 'axios';
import { listPurchasesQuery } from '../gqlQueries';
import CustomError from '../../CustomError';
import { IListSlicePurchases, IPurchase } from '../../../interfaces';
import { PurchasesDTO } from '../../../dto/purchases.dto';

const getAllPurchases = async (
  purchasesData: PurchasesDTO,
): Promise<{ allPurchases: IPurchase[] }> => {
  let allPurchases: IPurchase[] = [];

  const getSlicePurchases = async ({
    Authorization,
    uScreenEndpoint,
    first = 1000,
    type = 'BUY',
    fromDate,
    after,
  }: IListSlicePurchases): Promise<{ allPurchases: IPurchase[] }> => {
    try {
      const {
        data: {
          data: { listPurchases: { pageInfo: { hasNextPage, endCursor }, purchases } },
        },
      } = await axios.post(
        uScreenEndpoint,
        {
          query: listPurchasesQuery,
          variables: {
            first,
            type,
            fromDate,
            after,
          },
        },
        {
          headers: {
            Authorization,
          },
        },
      );

      allPurchases = [...allPurchases, ...purchases];

      if (hasNextPage) {
        await getSlicePurchases({
          Authorization,
          uScreenEndpoint,
          first,
          type,
          fromDate,
          after: endCursor,
        });
      }

      return { allPurchases };
    } catch (err) {
      if (err instanceof Error) {
        throw new CustomError(err.message, 'error while fetching purchases');
      }
      throw err;
    }
  };

  await getSlicePurchases(purchasesData);
  return { allPurchases };
};

export default getAllPurchases;
