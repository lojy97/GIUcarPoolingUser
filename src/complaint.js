import { gql } from 'apollo-server-express';
import { PrismaClient } from '@prisma/client';
import { checkAuth } from '../auth.js';

const prisma = new PrismaClient();

const typeDefs = gql`
  type Complaint {
    id: ID!
    senderId: String!
    receiverId: String!
    description: String!
    createdAt: String!
  }

  type Query {
    complaints: [Complaint!]!
    complaint(id: ID!): Complaint
    complaintsByReceiver(receiverId: String!): [Complaint!]!
  }

  type Mutation {
    createComplaint(
      senderId: String!
      receiverId: String!
      description: String!
    ): Complaint!

    deleteComplaint(id: ID!): Boolean!
  }
`;

const resolvers = {
  Query: {
    complaints: async (_, __, { role }) => {
      if (!checkAuth(['admin'], role)) {
        throw new Error('Unauthorized');
      }
      return await prisma.complaint.findMany();
    },

    complaint: async (_, { id }, { role }) => {
      if (!checkAuth(['admin', 'driver', 'student'], role)) {
        throw new Error('Unauthorized');
      }
      return await prisma.complaint.findUnique({ where: { id } });
    },

    complaintsByReceiver: async (_, { receiverId }, { role }) => {
      if (!checkAuth(['admin', 'driver', 'student'], role)) {
        throw new Error('Unauthorized');
      }
      return await prisma.complaint.findMany({
        where: {
          receiverId: receiverId,
        },
      });
    },
  },

  Mutation: {
    createComplaint: async (_, args, { role }) => {
      if (!checkAuth(['student', 'driver', 'admin'], role)) {
        throw new Error('Unauthorized');
      }

      return await prisma.complaint.create({
        data: {
          senderId: args.senderId,
          receiverId: args.receiverId,
          description: args.description,
        },
      });
    },

    deleteComplaint: async (_, { id }, { role }) => {
      if (!checkAuth(['admin'], role)) {
        throw new Error('Unauthorized');
      }

      try {
        await prisma.complaint.delete({ where: { id } });
        return true;
      } catch (error) {
        console.error('Delete failed:', error);
        return false;
      }
    },
  },
};

export const complaintTypeDefs = typeDefs;
export const complaintResolvers = resolvers;
