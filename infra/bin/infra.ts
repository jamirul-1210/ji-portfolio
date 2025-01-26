#!/usr/bin/env node
import 'dotenv/config'; 
import * as cdk from 'aws-cdk-lib';
import { AstroStack } from '../lib/astro-stack';

// Define the app
const app = new cdk.App();
new AstroStack(app, 'AstroStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});