/*
 * A very simple AWS Lambda function to respond with gratitude or acknowledge such emotion.
 */

const GRATITUDE_REGEX = /(thank|awesome|great|cool|woot)/gi;
const SALUTATION_REGEX = /(bye)/gi;
const GRATITUDE_STRING = "Thank you!";
const GRATITUDE_RESPONSES = [
  "You're most very welcome.",
  "No worries!"
];
const SALUTATION_RESPONSES = [
  "Talk to you later!",
  "Good bye!"
];

exports.handler = function (event, context) {
  console.log(event);

  let msg = event.inputTranscript;
  let response = GRATITUDE_STRING;
  if (msg ? msg.match(GRATITUDE_REGEX) : false) {
    // Acknowledge gratitude expressed in the message
    response = GRATITUDE_RESPONSES[Math.floor(Math.random() * GRATITUDE_RESPONSES.length)];
  } else if (msg ? msg.match(SALUTATION_REGEX) : false) {
    // Acknowledge expressed departure salutation
    response = SALUTATION_RESPONSES[Math.floor(Math.random() * SALUTATION_RESPONSES.length)];
  }

  let resp = {
    dialogAction: {
      type: "Close",
      fulfillmentState: "Fulfilled",
      message: {
        contentType: "PlainText",
        content: response
      }
    }
  };

  context.succeed(resp);
};
