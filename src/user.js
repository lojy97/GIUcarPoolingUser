import { gql } from 'apollo-server-express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { fetchRole, fetchId, checkAuth }from '../auth.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
 type LoginResponse {
    token: String!
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
    login(email: String!, password: String!): LoginResponse!
    updateUser(
  id: ID!
  name: String
  email: String
  universityId: String
  phoneNumber: String
  role: Role
  isEmailVerified: Boolean
  isPhoneVerified: Boolean
  isDriverApproved: Boolean
  isStudentApproved: Boolean
): User!
deleteUser(id: ID!): Boolean!

  }

`;

const resolvers = {
  //find users
  Query: {
    users: async (_, __, { role }) => {
      if (!checkAuth(["ADMIN"], role)) {
        throw new Error("Unauthorized");
      }
      return await prisma.user.findMany();
    },
    //find user by id
    user: async (_, { id }, { role }) => {
      if (!checkAuth(["ADMIN"], role)) {
        throw new Error("Unauthorized");
      }
      return await prisma.user.findUnique({ where: { id } });
    },
  },
  Mutation: {
    //create user
    createUser: async (_, args, { role }) => {
      if (!checkAuth(["ADMIN"], role)) {
        console.log("Role: ", role);
        console.log("Roles Authorized: ", ["ADMIN"]);
        console.log(checkAuth(["ADMIN"], role));
        throw new Error("Unauthorized");
      }
      const hashedPassword = await bcrypt.hash(args.password, 10);
      const user =await prisma.user.create({
        data: {
          ...args,
          password: hashedPassword,
        },
      });
      return user;
    },
    //login user
    login:async(_, { email, password }) => {
     
      const user= await prisma.user.findUnique({ where: { email } });
      console.log(user);

      if (!user) {
        throw new Error("User not found");
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new Error("Invalid credentials");
      }
      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET_KEY, {
        expiresIn: '1h',
      });
      return { token , role: user.role };
    },
    //update user
    updateUser: async (_, { id, ...data }, { role }) => {
      if (!checkAuth(["ADMIN"], role)) {
        throw new Error("Unauthorized");
      }
    
      try {
        const updatedUser = await prisma.user.update({
          where: { id },
          data,
        });
        return updatedUser;
      } catch (error) {
        console.error("Update failed:", error);
        throw new Error("Failed to update user");
      }
    },
    //delete user
    deleteUser: async (_, { id }, { role }) => {
      if (!checkAuth(["ADMIN"], role)) {
        throw new Error("Unauthorized");
      }
    
      try {
        await prisma.user.delete({
          where: { id },
        });
        return true;
      } catch (error) {
        console.error("Delete failed:", error);
        return false;
      }
    },
    
    
    
  },

  
};

export const userTypeDefs = typeDefs;
export const userResolvers = resolvers;

