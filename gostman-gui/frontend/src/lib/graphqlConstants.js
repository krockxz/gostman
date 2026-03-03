export const GRAPHQL_EXAMPLES = {
  query: `query GetUser($userId: ID!) {
  user(id: $userId) {
    id
    name
    email
    posts {
      id
      title
    }
  }
}`,
  mutation: `mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
    email
  }
}`,
  subscription: `subscription OnMessageReceived($chatId: ID!) {
  messageReceived(chatId: $chatId) {
    id
    content
    sender {
      id
      name
    }
    timestamp
  }
}`,
  variables: `{
  "userId": "1",
  "input": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}`
}
