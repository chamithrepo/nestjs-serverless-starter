import { Handler, Context } from 'aws-lambda';
import { Server } from 'http';
import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { createServer, proxy } from 'aws-serverless-express';
import { eventContext } from 'aws-serverless-express/middleware';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

let cachedServer: Server;

const bootstrapServer = async (): Promise<Server> => {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  const app = await NestFactory.create(AppModule, adapter, {
    logger: false,
  });

  app.use(eventContext());
  app.enableCors();

  await app.init();
  return createServer(expressApp);
};

export const handler: Handler = async (event, context) => {
  if (!cachedServer) {
    const server = await bootstrapServer();
    cachedServer = server;
    return proxy(server, event, context, 'PROMISE').promise;
  } else {
    return proxy(cachedServer, event, context, 'PROMISE').promise;
  }
};
