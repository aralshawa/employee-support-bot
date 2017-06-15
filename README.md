Employee Support Bot
============

TODO

Key Dependencies
------------
* [claudia](https://github.com/claudiajs/claudia) - A JS framework to help create and deploy Node.js projects to [AWS Lambda](https://aws.amazon.com/documentation/lambda/) and [API Gateway](https://aws.amazon.com/api-gateway/).
* [AWS Javascript SDK](https://github.com/aws/aws-sdk-js)
* [DynamoDB Document Javascript SDK](https://github.com/awslabs/dynamodb-document-js-sdk)

## Installation & Deployment
1. Clone this project.
2. Create an AWS profile named `claudia` (used in `package.json` scripts) with the following IAM programmatic access permissions:
    - AWSLambdaFullAccess
    - IAMFullAccess
    - AmazonAPIGatewayAdministrator
3. Add the profile keys to `.aws/credentials` ([Reference](https://claudiajs.com/tutorials/installing.html))
4. Create a `employee-support-executor` IAM role with the AmazonDynamoDBFullAccess policy.
5. Install [node 6.10.*](https://nodejs.org) to match the [Lambda execution environment](http://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html). Use [nvm](https://modernfidelity.github.io/blog/multiple-node-versions-with-brew-and-nvm/) to manage multiple node versions, if needed.
6. Make sure you have [npm](https://www.npmjs.org/) installed globally.
7. In the command prompt run the following commands.
```sh
$ cd `project-directory`
$ npm install
```
8. To create all of the cluadia configurations and deploy the Lambda functions with the default config specified in `package.json`.
```sh
$ npm run create
```
9. To synchronize any changes to the respective Lambda functions.

References
------------
* [Amazon Lex - Programming Model](http://docs.aws.amazon.com/lambda/latest/dg/programming-model.html)
* [Amazon Lex - Lambda Function Input Event and Response Format](http://docs.aws.amazon.com/lex/latest/dg/lambda-input-response-format.html)
* [AWS Lambda Function Handlers](http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html)
* [Claudia Issue #16 - Multiple lambda Entries in claudia.json](https://github.com/claudiajs/claudia/issues/16)
* [npm scripting: configs and arguments](http://www.marcusoft.net/2015/08/npm-scripting-configs-and-arguments.html)
