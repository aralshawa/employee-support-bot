/*
 * TODO
 */

var Promise = require('bluebird'),
    AWS = require('aws-sdk'),
    DOC = require('dynamodb-doc');

// Create a promisified version of the docClient
var docClient = Promise.promisifyAll(new DOC.DynamoDB())

/*
 * Database Operations
 */

function getTableName() {
  return "support-calls";
}

function getCallForNumber(phoneNumber) {
    var params = {
        TableName: getTableName(),
        Key: {
            phoneNumber: phoneNumber
        }
    };

    return docClient.getItemAsync(params);
}

/*
 * Bot Handler
 */

function performIntent(event, callback) {
  let intent = event.currentIntent.name;

  switch (intent) {
    case "ScheduleCall":
      break;
    case "CallStatus":
      break;
    default:
      throw new Error(`"${intent}" intent not supported.`);
  }
}

exports.handler = function (event, context, callback) {
  console.log(event);

  try {
    performIntent(event, (response) => callback(null, response));
  } catch (error) {
    callback(error)
  }
};
