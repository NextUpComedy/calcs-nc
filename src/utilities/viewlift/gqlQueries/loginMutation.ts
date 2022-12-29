const loginMutation = `mutation login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    __typename
    ... on LoginSuccess {
      access_token
    }
    ... on LoginError {
      error
      error_description
    }
  }
}`;

export default loginMutation;
