import { gql } from 'apollo-server-express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { checkAuth } from '../auth.js';

const typeDefs = gql`
  enum RequestType {
    STUDENT
    DRIVER
  }

  enum RequestStatus {
    PENDING
    APPROVED
    REJECTED
  }

  type Request {
    id: ID!
    studentId: String!
    universityId: String!
    requestType: RequestType!
    status: RequestStatus!
    createdAt: String!
    reviewedAt: String
  }

  type Query {
    requests: [Request!]!
    request(id: ID!): Request
  }

  type Mutation {
    createRequest(
      studentId: String!
      universityId: String!
      requestType: RequestType!
    ): Request!

    updateRequest(
      id: ID!
      status: RequestStatus
      reviewedAt: String
    ): Request!

    deleteRequest(id: ID!): Boolean!
  }
`;

const resolvers = {
  Query: {
    // ADMIN only
    requests: async (_, __, { role }) => {
      if (!checkAuth(['ADMIN'], role)) {
        throw new Error('Unauthorized');
      }
      return await prisma.request.findMany();
    },

    // All roles
    request: async (_, { id }, { role }) => {
      if (!checkAuth(['ADMIN', 'DRIVER', 'PASSENGER'], role)) {
        throw new Error('Unauthorized');
      }
      return await prisma.request.findUnique({ where: { id } });
    },
  },

  Mutation: {
    // All roles
    createRequest: async (_, args, { role }) => {
      if (!checkAuth(['ADMIN', 'DRIVER', 'PASSENGER'], role)) {
        throw new Error('Unauthorized');
      }
      return await prisma.request.create({
        data: {
          ...args,
          status: 'PENDING',
        },
      });
    },

    // ADMIN only
    updateRequest: async (_, { id, ...data }, { role }) => {
      if (!checkAuth(['ADMIN'], role)) {
        throw new Error('Unauthorized');
      }
      try {
        return await prisma.request.update({
          where: { id },
          data,
        });
      } catch (error) {
        console.error('Update failed:', error);
        throw new Error('Failed to update request');
      }
    },

    // ADMIN only
    deleteRequest: async (_, { id }, { role }) => {
      if (!checkAuth(['ADMIN'], role)) {
        throw new Error('Unauthorized');
      }
      try {
        await prisma.request.delete({ where: { id } });
        return true;
      } catch (error) {
        console.error('Delete failed:', error);
        return false;
      }
    },
  },
};

export const requestTypeDefs = typeDefs;
export const requestResolvers = resolvers;
