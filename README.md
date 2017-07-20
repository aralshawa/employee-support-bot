Employee Support Bot
============

At some point human-human interaction becomes invaluable: it's immediate and provides a clear sense of progress to the customer. The goal of this project is to provide a front-end to that interaction by gathering data from the user, answering any simple questions, and connecting them to an available agent.

Rather than customers calling into an automated system from the get-go and being placed on hold, they begin with chatting with a bot in an attempt to diagnose the nature of the problem. If it's a quick question (e.x. "what are your hours?"), the bot can simply answer. When the bot has identified the nature of the question and which support staff line would be most appropriate to handle it, it will notify the user that it has queued up their number to be addressed by a human staff member and will be called back.

Project Scope & Context
------------
An enterprise application with a private integration into a company's [Slack](https://slack.com) channel:
- **[Bot Intent Specifications](/design/Intents.md)**
- Contacting HR
- Employee would initiate a ticket via the bot
	- General info or personal file request
	- Nature (HR: Payroll, health, etc.)
- Once the intent of the ticket is identified, store the state as `pending response`
	- The user is prompted that they will be placed in queue and contacted regarding their ticket via phone
	- User can query for their state and estimated fulfillment time
	- User can request phone or textual response
	- Can provide "in the meantime" resources
	- Can cancel request
- Distinct support staff bot to dequeue tickets, get a summary of the request, and initiate a fulfillment call.

![Application System Diagram](/design/system_diagram.png?raw=true)
<p align="center">
	A high level system diagram showcasing the Amazon Lex intents, associated data slots, and key Lambda functions.
</p>

Key Dependencies
------------
* [claudia](https://github.com/claudiajs/claudia) - A JS framework to help create and deploy Node.js projects to [AWS Lambda](https://aws.amazon.com/documentation/lambda/) and [API Gateway](https://aws.amazon.com/api-gateway/).
* [AWS Javascript SDK](https://github.com/aws/aws-sdk-js)
* [DynamoDB Document Javascript SDK](https://github.com/awslabs/dynamodb-document-js-sdk)

#### Installation & Deployment
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

Future Work
------------
- Addressing potential privacy concerns (e.x. scheduling a call with someone else's phone number or looking up if someone has a scheduled call)
- Integrating with [Amazon Cognito](https://aws.amazon.com/cognito/) for user-specific actions and persistence
- Support for [Amazon Connect](https://aws.amazon.com/connect/connect-lexchatbot/) contact centers integrations

References
------------
#### AWS Lex
* [Amazon Lex - Lambda Function Input Event and Response Format](http://docs.aws.amazon.com/lex/latest/dg/lambda-input-response-format.html)
* [Lex & Alexa Slot Type Reference](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/built-in-intent-ref/slot-type-reference)
* [Integrating an Amazon Lex Bot with Slack](http://docs.aws.amazon.com/lex/latest/dg/slack-bot-association.html)

#### AWS Lambda
* [Programming Model](http://docs.aws.amazon.com/lambda/latest/dg/programming-model.html)
* [AWS Lambda Function Handlers](http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html)

#### AWS DynamoDB
* [DynamoDB Action Reference](http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Operations_Amazon_DynamoDB.html)
* [DynamoDB Document Client API](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html)
* [Working with DynamoDB](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithDynamo.html)
* [Partition Key Theory](https://aws.amazon.com/blogs/database/choosing-the-right-dynamodb-partition-key/)

#### Claudia
* [Claudia Issue #16 - Multiple lambda Entries in claudia.json](https://github.com/claudiajs/claudia/issues/16)
* [npm scripting: configs and arguments](http://www.marcusoft.net/2015/08/npm-scripting-configs-and-arguments.html)
