import { gql } from 'apollo-server-express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { checkAuth } from '../auth.js';

const typeDefs = gql`
  type Car {
    id: ID!
    DriverId: String!
    carModel: String!
    carModelYear: String!
    seats: Int!
  }

  type Query {
    cars: [Car!]!
  }

  type Mutation {
    createCar(
      DriverId: String!
      carModel: String!
      carModelYear: String!
      seats: Int!
    ): Car!
    updateCar(
      id: ID!
      carModel: String
      carModelYear: String
      seats: Int
    ): Car!
  }
`;

const resolvers = {
  Query: {
    // Find all cars (only ADMIN)
    cars: async (_, __, { role }) => {
      if (!checkAuth(['admin'], role)) {
        throw new Error('Unauthorized');
      }
      return await prisma.car.findMany();
    },
  },
  Mutation: {
    // Create a car (only ADMIN)
    createCar: async (_, args, { role }) => {
      if (!checkAuth(['admin'], role)) {
        throw new Error('Unauthorized');
      }
      const newCar = await prisma.car.create({
        data: args,
      });
      return newCar;
    },

    // Update a car (only ADMIN)
    updateCar: async (_, { id, ...data }, { role }) => {
      if (!checkAuth(['admin'], role)) {
        throw new Error('Unauthorized');
      }

      try {
        const updatedCar = await prisma.car.update({
          where: { id },
          data,
        });
        return updatedCar;
      } catch (error) {
        console.error('Update failed:', error);
        throw new Error('Failed to update car');
      }
    },
  },
};

export const carTypeDefs = typeDefs;
export const carResolvers = resolvers;
