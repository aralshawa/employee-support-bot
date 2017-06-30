/*
 * A AWS Lambda function to perform a info lookup depending on the request.
 */

var Database = require('./databaseUtils');

const EMPLOYEE_SUPPORT_TABLE = "employee-support-info";

function getSupportDescription(key) {
    var params = {
        TableName: EMPLOYEE_SUPPORT_TABLE,
        Key: {
            infoID: key
        }
    };

    return Database.client.getAsync(params);
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
