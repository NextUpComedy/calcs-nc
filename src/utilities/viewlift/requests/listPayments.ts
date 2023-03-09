import axios from 'axios';
import { ListPaymentsDTO } from '../../../dto/payment.dto';
import { IListOffsetPayments, IPayment } from '../../../interfaces';
import CustomError from '../../CustomError';
import { listPaymentsQuery } from '../gqlQueries';

const getAllPayments = async (
  listPaymentsData: ListPaymentsDTO,
): Promise<{ paymentsList: IPayment[] }> => {
  let paymentsList: IPayment[] = [];

  const listOffsetPayments = async ({
    Authorization,
    uScreenEndpoint,
    offset = 0,
    limit,
    after,
  }: IListOffsetPayments): Promise<{ paymentsList: IPayment[] }> => {
    try {
      const { data: { data: { listPayments: { billingHistory } } } } = await axios
        .post(uScreenEndpoint, {
          query: listPaymentsQuery,
          variables: {
            after,
            limit,
            offset,
          },
        }, {
          headers: {
            Authorization,
          },
        });

      paymentsList = [...paymentsList, ...billingHistory];

      if (billingHistory.length === limit) {
        await listOffsetPayments({
          Authorization,
          uScreenEndpoint,
          offset: offset + limit,
          limit,
          after,
        });
      }

      return { paymentsList };
    } catch (error) {
      if (error instanceof Error) {
        throw new CustomError(error.message, 'error while fetching payments');
      }
      throw error;
    }
  };

  await listOffsetPayments(listPaymentsData);
  return { paymentsList };
};

export default getAllPayments;
