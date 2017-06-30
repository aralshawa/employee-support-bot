/*
 * TODO
 */

var PhoneNumber = require('awesome-phonenumber'),
    LexUtils = require('./lexUtils'),
    Database = require('./databaseUtils');

/*
 * Database Operations
 */

const EMPLOYEE_CALLS_TABLE = "support-calls";

function getCallForNumber(phoneNumber) {
    var params = {
        TableName: EMPLOYEE_CALLS_TABLE,
        Key: {
            callID: phoneNumber
        }
    };

    return docClient.getItemAsync(params);
}

/*
 * Data Validation
 */

function dateForDateString(dateStr) {
  // Assuming the standard YYY-MM-DD date format, parse the string and construct a date object
  // A null return indicates a failure to parse the string
  try {
    if (dateStr == null) throw "Unspecified date string.";

    let dateComponents = dateStr.split(/\-/);
    let parsedDate = new Date(dateComponents[0], dateComponents[1] - 1, dateComponents[2]);

    return !(isNaN(parsedDate.getTime())) ? parsedDate : null;
  } catch (error) {
    return null;
  }
}

function validationResult(valid, violatedSlot, messageText) {
  return {
    valid, violatedSlot, message: { contentType: 'PlainText', content: messageText }
  };
}

function validateCall(slots) {
  const phone = slots.phone, date = slots.date, time = slots.time;

  // Validate 'name'
  // if (name.length == 0) {
  //   return validationResult(false, "name", "Please specify your name for our records.");
  // }

  // Validate 'phone'
  let parsedPhone = phone ? PhoneNumber(phone, "US") : null;
  if (parsedPhone && !parsedPhone.isValid()) {
    return validationResult(false, "phone", `The number "${phone}" is not valid. Please specify a different number.`);
  }

  // Validate 'date'
  var parsedDate = dateForDateString(date);
  if (parsedDate) {
    if (parsedDate < new Date()) {
      // If the provided date that is in the past
      return validationResult(false, "date", "Please specify a date that is today or in the future.");
    }
  } else if (date) {
    return validationResult(false, "date", "I could not comprehend the provided date. Can you please respecify it?");
  }

  // Validate 'time'
  if (parsedDate && time) {
    var timeComponents = time.split(":");
    parsedDate.hours = timeComponents[0];
    parsedDate.minutes = timeComponents[1];

    if (parsedDate < new Date()) {
      // If the provided time that is in the past
      return validationResult(false, "date", "Please specify a time later today.");
    }
  }

  return {valid: true};
}

/*
 * Intent Fulfilment
 */

function scheduleCall(request, callback) {
  const slots = request.currentIntent.slots;
  const sessionAttributes = request.sessionAttributes || {};

  sessionAttributes.request = String(JSON.stringify(slots));

  if (request.invocationSource === "DialogCodeHook") {
      // Validate any slots and re-elicit
      const validationResult = validateCall(slots);

      if (!validationResult.valid) {
        // If an invalid field exists
        slots[`${validationResult.violatedSlot}`] = null;
        callback(LexUtils.elicitSlotForIntent(sessionAttributes, request.currentIntent.name, slots, validationResult.violatedSlot, validationResult.message));
      } else {
        // Otherwise, let native DM rules determine how to elicit for slots and prompt for confirmation.  Pass price back in sessionAttributes once it can be calculated; otherwise clear any setting from sessionAttributes.
        callback(LexUtils.delegateResponse(sessionAttributes, slots));
      }
  } else {
    // Schedule phone call
    // TODO: Implement business logic
    console.log(`scheduleCall sessionAttributes=${sessionAttributes.request}`);

    callback(LexUtils.closeIntent(sessionAttributes, 'Fulfilled',
    { contentType: 'PlainText', content: `Thanks, Your call has been placed in queue. We'll call you at ${slots.phone} around ${slots.time} on ${slots.date}.` }));
  }
}

function getCallStatus(request, callback) {
  // TODO: Method Stub
}

/*
 * Bot Handler
 */

function performIntent(event, callback) {
  let intent = event.currentIntent.name;

  switch (intent) {
    case "ScheduleCall":
      scheduleCall(event, callback);
      break;
    case "CallStatus":
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
