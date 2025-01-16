import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3Deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path'; 


export class JiPortfolioStaticDeployStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // Create an S3 bucket for hosting the static site
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: false, // Block public access
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
      autoDeleteObjects: true, // Auto delete objects when the stack is destroyed
    });

    // Create a CloudFront Origin Access Identity (OAI)
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for ${id}`,
    });

    // Grant the CloudFront distribution access to the S3 bucket
    siteBucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [`${siteBucket.bucketArn}/*`],
        principals: [new cdk.aws_iam.CanonicalUserPrincipal(originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
      })
    );

    // Create a CloudFront distribution for the site
    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'SiteDistribution', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: siteBucket,
            originAccessIdentity,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
    });

    // Use path module to set the source path
    const assetPath = path.resolve(__dirname,'..','..','dist'); 

    // Deploy the site content to the S3 bucket
    new s3Deploy.BucketDeployment(this, 'DeploySite', {
      sources: [s3Deploy.Source.asset(assetPath)], // Use the assetPath
      destinationBucket: siteBucket,
      distribution, // Invalidate CloudFront cache after deployment
      distributionPaths: ['/*'],
    });

    // Output the CloudFront URL
    new cdk.CfnOutput(this, 'SiteURL', {
      value: distribution.distributionDomainName,
      description: 'The URL of the deployed static site',
    });

  }
}
