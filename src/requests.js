import { gql } from 'apollo-server-express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { checkAuth } from '../auth.js';
import { GraphQLUpload } from 'graphql-upload';
import * as fs from 'fs';
import * as path from 'path';
import { createWriteStream } from 'fs';

const typeDefs = gql`
  scalar Upload

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
    licenseURL: String
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
      file: Upload
    ): Request!

    updateRequest(
      id: ID!
      status: RequestStatus
      reviewedAt: String
    ): Request!

    deleteRequest(id: ID!): Boolean!
  }
`;

async function saveUploadedFile(file) {
  // Ensure file contains the expected properties (createReadStream, filename, mimetype)
  const { createReadStream, filename, mimetype } = await file;

  // Define the upload directory path
  const uploadDir = path.join(process.cwd(), 'uploads', 'licenses');

  // Create the upload directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Generate a unique filename to avoid collisions
  const uniqueFilename = `${Date.now()}-${filename}`;
  const filePath = path.join(uploadDir, uniqueFilename);
  const fileUrl = `/uploads/licenses/${uniqueFilename}`;

  // Create a write stream to save the file on the server
  const writeStream = createWriteStream(filePath);

  // Create a read stream from the uploaded file
  const stream = createReadStream();

  // Pipe the file data to the server
  await new Promise((resolve, reject) => {
    stream.pipe(writeStream).on('finish', resolve).on('error', reject);
  });

  return fileUrl;
}

const resolvers = {
  Upload: GraphQLUpload, // Enable handling of file uploads

  Query: {
    requests: async (_, __, { role }) => {
      if (!checkAuth(['admin'], role)) {
        throw new Error('Unauthorized');
      }
      return await prisma.request.findMany();
    },

    request: async (_, { id }, { role }) => {
      if (!checkAuth(['admin', 'driver', 'student'], role)) {
        throw new Error('Unauthorized');
      }
      return await prisma.request.findUnique({ where: { id } });
    },
  },

  Mutation: {
    createRequest: async (_, args, { role }) => {
      // Destructure file and other arguments
      const { file, ...restData } = args;

      const updateData = {
        ...restData,
        status: 'PENDING',
      };

      // If a file is uploaded, process and store the file URL
      if (file) {
        updateData.licenseURL = await saveUploadedFile(file);
      }

      // Create the request in the database
      return await prisma.request.create({
        data: updateData,
      });
    },

    updateRequest: async (_, { id, ...data }, { role }) => {
      if (!checkAuth(['admin'], role)) {
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

    deleteRequest: async (_, { id }, { role }) => {
      if (!checkAuth(['admin'], role)) {
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
