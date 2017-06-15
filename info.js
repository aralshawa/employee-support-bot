/*
 * A AWS Lambda function to perform a info lookup depending on the request.
 */

exports.handler = function (event, context) {
  console.log(event);

  let resp = {
    dialogAction: {
      type: "Close",
      fulfillmentState: "Fulfilled",
      message: {
        contentType: "PlainText",
        content: "TODO"
      }
    }
  }

  context.succeed(resp);
};
