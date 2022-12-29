import axios from 'axios';
import { loginMutation as query } from '../gqlQueries';
import { ILoginResponse } from '../../../interfaces';

const viewliftLogin = async ({
  email, password, viewliftEndpoint,
}:{
  email: string, password: string, viewliftEndpoint: string,
}): Promise<ILoginResponse> => {
  const { data: { data: { login: { access_token: Authorization } } } } = await axios
    .post(
      viewliftEndpoint,
      {
        query,
        variables: { email, password },
      },
    );

  return { Authorization };
};

export default viewliftLogin;
