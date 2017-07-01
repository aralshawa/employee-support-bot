/*
 * TODO
 */

var PhoneNumber = require('awesome-phonenumber'),
    hasha = require('hasha'),
    LexUtils = require('./lexUtils'),
    Database = require('./databaseUtils');

/*
 * Database Operations
 */

const EMPLOYEE_CALLS_TABLE = "employee-support-calls";

function getActiveCallsForNumber(phoneNumber) {
  var params = {
      TableName: EMPLOYEE_CALLS_TABLE,
      ProjectionExpression:"callID, #st, phone, timestamp",
      KeyConditionExpression: "phone = :phoneNumber AND #st between :stRange1 and :stRange2",
      ExpressionAttributeNames:{
        "#st": "status"
      },
      ExpressionAttributeValues: {
        ":phoneNumber": phoneNumber.replace(/[^0-9]/g, ""),
        ":stRange1": 0,
        ":stRange2": 20
      }
  };

  return Database.client.queryAsync(params);
}

function putActiveCall(phoneNumber, dateStr, timeStr) {
  var numericPhone = parseInt(phoneNumber.replace(/[^0-9]/g, ""), 10);
  var parsedDate = dateForDateTimeStrTuple(dateStr, timeStr);
  var timestamp = parsedDate ? parsedDate.getTime() / 1000 : null;

  var params = {
      TableName: EMPLOYEE_CALLS_TABLE,
      Item: {
          callID: hasha([numericPhone.toString(), timestamp.toString()], {algorithm: 'md5'}),
          phone: numericPhone,
          status: 0,
          timestamp
      }
  };

  return Database.client.putAsync(params);
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

function dateForDateTimeStrTuple(dateStr, timeStr) {
  // Translates the date and time strings to a Date object
  try {
    if (dateStr == null) throw "Unspecified date string.";

    var parsedDate = dateForDateString(dateStr);

    if (parsedDate && timeStr) {
      var timeComponents = timeStr.split(":");
      parsedDate.hours = timeComponents[0];
      parsedDate.minutes = timeComponents[1];
    }
    return parsedDate;
  } catch (error) {
    return null;
  }
}

function dateForEpochTime(epochSec) {
  try {
    if (epochSec == null) throw "Unspecified epoch time.";

    var date = new Date(0); // The 0 there is the key, which sets the date to the epoch
    date.setUTCSeconds(epochSec);

    return date;
  } catch (error) {
    return null;
  }
}

function dateStrForDate(date) {
  try {
    if (date == null) throw "Unspecified date.";
    return `${date.getDay()}-${date.getMonth() + 1}-${date.getYear()} ${date.getHours()}:${date.getMinutes()}`;
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

    putActiveCall(slots.phone, slots.date, slots.time).then((result) => {
      const formattedPhone = PhoneNumber(slots.phone, "US").getNumber('national');

      if (result.err == null) {
        callback(LexUtils.closeIntent(sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: `Thanks, Your call has been placed in queue. We'll call you at ${formattedPhone} around ${slots.time} on ${slots.date}.` }));
      } else {
        callback(LexUtils.closeIntent(sessionAttributes, 'Failed',
        { contentType: 'PlainText', content: `Unfortunately, your request to call you at ${formattedPhone} around ${slots.time} on ${slots.date} could not be completed at this time. Please try again later.` }));
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
