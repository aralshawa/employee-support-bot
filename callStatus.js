/*
 * An AWS Lambda function to query the status of a scheduled call.
 */

var PhoneNumber = require('awesome-phonenumber'),
    hasha = require('hasha'),
    LexUtils = require('./lexUtils'),
    DateUtils = require('./dateUtils'),
    Database = require('./databaseUtils');

/*
 * Database Operations
 */

const EMPLOYEE_CALLS_TABLE = "employee-support-calls";

function getCallsForNumber(phoneNumber) {
  // NOTE: The database contains a sort key against 'timestamp' field and all query results are sorted by the sort key value (in this case, in numeric order).
  var numericPhone = parseInt(phoneNumber.replace(/[^0-9]/g, ""), 10);

  var params = {
      TableName: EMPLOYEE_CALLS_TABLE,
      ProjectionExpression:"callID, #st, phone, #ts",
      KeyConditionExpression: "phone = :phoneNumber",
      ExpressionAttributeNames:{
        "#st": "status",
        "#ts": "timestamp"
      },
      ExpressionAttributeValues: {
        ":phoneNumber": numericPhone
      }
  };

  return Database.client.queryAsync(params);
}

/*
 * Data Validation
 */

function validateRequest(slots) {
  const phone = slots.phone;

  // Validate 'phone'
  let parsedPhone = phone ? PhoneNumber(phone, "US") : null;
  if (parsedPhone && !parsedPhone.isValid()) {
    return LexUtils.validationResult(false, "phone", `The number "${phone}" is not valid. Please specify a different number.`);
  }

  return {valid: true};
}

/*
 * Intent Fulfilment
 */

function lookupCallStatus(request, callback) {
  const slots = request.currentIntent.slots;
  const sessionAttributes = request.sessionAttributes || {};
  const confirmationStatus = request.currentIntent.confirmationStatus;

  if (request.invocationSource === "DialogCodeHook") {
    const prevRequest = sessionAttributes.request ? JSON.parse(sessionAttributes.request) : null;
    const previouslyUsedNumber = prevRequest ? prevRequest.phone : null;

    if (confirmationStatus == "None" && previouslyUsedNumber) {
      // If a number is found in the session, ask the user if they would like to use it
      const formattedPhone = PhoneNumber(previouslyUsedNumber, "US").getNumber('national');
      callback(LexUtils.confirmIntent(sessionAttributes, request.currentIntent.name, slots, { contentType: 'PlainText', content: `Is ${formattedPhone} your phone number?`}));
    } else if (confirmationStatus == "Denied") {
      // Clear previous state and re-elicit slots
      delete sessionAttributes.request;
      slots.phone = null;
      callback(LexUtils.elicitSlotForIntent(sessionAttributes, request.currentIntent.name, slots, 'phone', { contentType: 'PlainText', content: `What phone number are you inquiring about?`}));
    } else {
      if (confirmationStatus == "Confirmed") {
        // If the user confirmed the use of the session stored phone number, update the slot
        slots.phone = previouslyUsedNumber;
      }

      LexUtils.validateAndReElicit(request, slots, sessionAttributes, validateRequest, callback);
    }
  } else {
    // Look up the status of any calls for the provided phone number
    const formattedPhone = PhoneNumber(slots.phone, "US").getNumber('national');

    getCallsForNumber(slots.phone).then((result) => {
      console.log("getCallsForNumber ", result.Items);

      if (result.Items.length > 0) {
        // Get the most latest recorded call
        const latestCall = result.Items.slice(-1)[0];
        const dateOfCall = DateUtils.dateForEpochTime(latestCall.timestamp);
        const isUpcomingCall = latestCall.timestamp >= Math.round(new Date().getTime() / 1000.0);

        // Construct the base message based on tense of statement
        if (isUpcomingCall) {
          var msg = `An upcoming call with ${formattedPhone} is scheduled for ${DateUtils.dateStrForDate(dateOfCall)}. `;
        } else {
          var msg = `The most recent call with ${formattedPhone} was scheduled for ${DateUtils.dateStrForDate(dateOfCall)}. `;
        }

        // Customize statement for the call status
        switch (latestCall.status) {
          case -10:
            msg += "The call was cancelled. Please contact support for details.";
            break;
          case 0:
            msg += "The call is currently in queue.";
            break;
          case 10:
            msg += "Unfortunately, staff could not reach the client at the originally scheduled time. It has been appropriately rescheduled.";
            break;
          case 20:
            msg += "Unfortunately, staff could not reach the client at the scheduled time. Please reseachdule as per your availability.";
            break;
          case 50:
            msg += "The client was successfully reached.";
            break;
          default:
            throw new Error(`Unrecognized status "${latestCall.status}".`);
        }

        callback(LexUtils.closeIntent(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: msg}));
      } else {
        // No call history for this number
        callback(LexUtils.closeIntent(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: `Sorry, no calls have been scheduled with the phone number ${formattedPhone}.`}));
      }
    });
  }
}

/*
 * Bot Handler
 */

function performIntent(event, callback) {
  let intent = event.currentIntent.name;

  switch (intent) {
    case "CallStatus":
      lookupCallStatus(event, callback);
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
