import axios from 'axios';
import { loginMutation as query } from '../gqlQueries';
import { ILoginResponse } from '../../../interfaces';

const viewliftLogin = async ({
  email, password, uScreenEndpoint,
}:{
  email: string, password: string, uScreenEndpoint: string,
}): Promise<ILoginResponse> => {
  const { data: { data: { login: { access_token: Authorization } } } } = await axios
    .post(
      uScreenEndpoint,
      {
        query,
        variables: { email, password },
      },
    );

  return { Authorization };
};

export default viewliftLogin;
