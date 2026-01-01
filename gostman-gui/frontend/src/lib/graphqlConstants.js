export const GRAPHQL_EXAMPLES = {
    query: `# GraphQL Query
query GetUser($userId: ID!) {
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
    mutation: `# GraphQL Mutation
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
    email
  }
}`,
    subscription: `# GraphQL Subscription
subscription OnMessageReceived($chatId: ID!) {
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
    variables: `# Query Variables
{
  "userId": "1",
  "input": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}`
}
