const { ApolloServer, gql } = require('apollo-server');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const typeDefs = gql`
  enum Role {
    ADMIN
    DRIVER
    PASSENGER
  }

  type User {
    id: ID!
    name: String!
    email: String!
    universityId: String!
    phoneNumber: String
    isEmailVerified: Boolean!
    isPhoneVerified: Boolean!
    role: Role!
    isDriverApproved: Boolean!
    isStudentApproved: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
  }

  type Mutation {
    createUser(
      name: String!
      email: String!
      universityId: String!
      password: String!
      phoneNumber: String
      role: Role
    ): User!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    users: () => prisma.user.findMany(),
    user: (_, { id }) => prisma.user.findUnique({ where: { id } }),
  },
  Mutation: {
    createUser: async (_, args) => {
      return await prisma.user.create({
        data: {
          ...args,
        },
      });
    },
  },
};

// Start server
const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
