import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Passwordless } from "amazon-cognito-passwordless-auth/cdk";


export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /** Create User Pool */
    const userPool = new cdk.aws_cognito.UserPool(this, "UserPool", {
      signInAliases: {
        username: false, // don't need this actually in this demo
        email: true,
      },
    });

    const passwordless = new Passwordless(this, "Passwordless", {
      userPool,
      allowedOrigins: [process.env.WS_PREVIEW_URL!],
      // Added:
      magicLink: {
        sesFromAddress: process.env.WS_EMAIL!,
      },
    });
  }
}