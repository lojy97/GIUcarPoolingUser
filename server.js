import { ApolloServer, gql } from 'apollo-server-express';
import express from 'express';
import cookie from 'cookie';
import cors from 'cors';
import { requestTypeDefs, requestResolvers } from './src/requests.js';
import { carTypeDefs, carResolvers } from './src/car.js';
import { fetchRole, fetchId } from './auth.js';
import { userTypeDefs, userResolvers } from './src/user.js';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { complaintTypeDefs, complaintResolvers } from './src/complaint.js';

import * as fs from 'fs';
import * as path from 'path';
import { createWriteStream } from 'fs';

import { graphqlUploadExpress } from "graphql-upload";

import dotenv from 'dotenv';
dotenv.config();

(async function () {
  console.log('👋 server.js is starting...');


  const rootTypeDefs = gql`
    type Query {
      setCookie: String
    }
 type LoginResponse {
    token: String!
  }
    type Mutation {
      _empty: String
      
    }
  `;

  const rootResolvers = {
    Query: {
      setCookie: (_, __, { req, res }) => {
        res.cookie('myCookie', 'cookieValue', {
          httpOnly: true,
          expires: new Date(Date.now() + 900000),
          secure: process.env.NODE_ENV === 'production', 
           sameSite: 'None'
        });

        const cookies = cookie.parse(req.headers.cookie || '');
        console.log('Parsed cookies:', cookies);
        console.log('Request Host:', req.headers.host);
        console.log('Client IP:', req.ip);

        return 'Cookie set!';
      },
    },
    Mutation: {},
  };


  const typeDefs = mergeTypeDefs([rootTypeDefs, userTypeDefs,  requestTypeDefs,  carTypeDefs,complaintTypeDefs]);
  const resolvers = mergeResolvers([rootResolvers, userResolvers, requestResolvers, carResolvers, complaintResolvers]);

  const app = express();

  const corsOptions = {
    origin: ['http://localhost:3000', 'https://studio.apollographql.com'],
    credentials: true,
  };
  app.use(cors(corsOptions));
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));

  // Serve static files for uploaded images
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")))

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req, res }) => {
      const role = fetchRole(req.headers.cookie);
      const id = fetchId(req.headers.cookie);
      return { req, res, role, id };
    },
    introspection: true,
  });

  await server.start();
  console.log('🚀 Apollo Server started');

  await server.applyMiddleware({ app, path: '/graphql', cors: false });
  console.log('✅ Middleware applied');

  app.listen({ port: 4000 }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
})();
