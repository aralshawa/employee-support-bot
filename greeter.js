/*
 * A very simple AWS Lambda function to respond to any event with a random greeting.
 */

var greeting = require('greeting');

exports.handler = function (event, context) {
  console.log(event);

  let resp = {
    dialogAction: {
      type: "Close",
      fulfillmentState: "Fulfilled",
      message: {
        contentType: "PlainText",
        content: greeting.random() + "! What can I help you with?"
      }
    }
  }

  context.succeed(resp);
};
