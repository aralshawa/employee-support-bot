/*
 * A AWS Lambda function to perform a info lookup depending on the request.
 */

var Promise = require('bluebird'),
    AWS = require('aws-sdk'),
    DOC = require('dynamodb-doc');

// Create a promisified version of the docClient
var docClient = Promise.promisifyAll(new DOC.DynamoDB())

function getTableName() {
  return "employee-support-info";
}

function getSupportDescription(key) {
    var params = {
        TableName: getTableName(),
        Key: {
            infoID: key
        }
    };

    return docClient.getItemAsync(params);
}

exports.handler = function (event, context, callback) {
  console.log(event);

  let type = event.currentIntent.slots.type

  if (type != null) {
    getSupportDescription(type.toLowerCase()).then((result) => {
      console.log("Query result ", result.Item);

      if (result.Item) {
        // A valid result has been returned from the Dynamo query
        let content = result.Item.description || "Sorry, I don't have any information on this.";

        let resp = {
          dialogAction: {
            type: "Close",
            fulfillmentState: "Fulfilled",
            message: {
              contentType: "PlainText",
              content: content
            }
          }
        };

        callback(null, resp);
      } else {
        callback(true, "Unknown information type requested.");
      }
    });
  } else {
    callback(true, "Invalid information type requested.");
  }
};
