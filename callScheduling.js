/*
 * TODO
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

function getActiveCallsForNumber(phoneNumber) {
  var numericPhone = parseInt(phoneNumber.replace(/[^0-9]/g, ""), 10);

  var params = {
      TableName: EMPLOYEE_CALLS_TABLE,
      ProjectionExpression:"callID, #st, phone, #ts",
      FilterExpression: "phone = :phoneNumber AND #st BETWEEN :stRange1 AND :stRange2",
      ExpressionAttributeNames:{
        "#st": "status",
        "#ts": "timestamp"
      },
      ExpressionAttributeValues: {
        ":phoneNumber": numericPhone,
        ":stRange1": 0,
        ":stRange2": 20
      }
  };

  return Database.client.scanAsync(params);
}

function putActiveCall(phoneNumber, dateStr, timeStr) {
  var numericPhone = parseInt(phoneNumber.replace(/[^0-9]/g, ""), 10);
  var parsedDate = DateUtils.dateForDateTimeStrTuple(dateStr, timeStr);
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

function deleteCall(phone, timestamp) {
  var params = {
    TableName: EMPLOYEE_CALLS_TABLE,
    Key: {
      phone,
      timestamp
    }
  };

  return Database.client.deleteAsync(params);
}

/*
 * Data Validation
 */

function validateCall(slots) {
  const phone = slots.phone, date = slots.date, time = slots.time;

  // Validate 'name'
  // if (name.length == 0) {
  //   return LexUtils.validationResult(false, "name", "Please specify your name for our records.");
  // }

  // Validate 'phone'
  let parsedPhone = phone ? PhoneNumber(phone, "US") : null;
  if (parsedPhone && !parsedPhone.isValid()) {
    return LexUtils.validationResult(false, "phone", `The number "${phone}" is not valid. Please specify a different number.`);
  }

  // TODO: Validate date and time is within business operating hours
  // Validate 'date'
  var parsedDate = DateUtils.dateForDateString(date);
  if (parsedDate) {
    if (parsedDate < new Date()) {
      // If the provided date that is in the past
      return LexUtils.validationResult(false, "date", "Please specify a date that is today or in the future.");
    } else if (parsedDate.getDay() == 6 || parsedDate.getDay() == 0) {
      // If the provided date is not a work day
      // TODO: Need to also validate company specific and public holidays
      return LexUtils.validationResult(false, "date", "Sorry, we do not operate during the weekend. Please specify another date during the work week.");
    }
  } else if (date) {
    return LexUtils.validationResult(false, "date", "I could not comprehend the provided date. Can you please respecify it?");
  }

  // Validate 'time'
  if (parsedDate && time) {
    var timeComponents = time.split(":");
    parsedDate.hours = timeComponents[0];
    parsedDate.minutes = timeComponents[1];

    // TODO: Perform a lookup against the 'employee-support-info' database for valid operating hours.
    if (parsedDate < new Date()) {
      // If the provided time that is in the past
      return LexUtils.validationResult(false, "date", "Please specify a time later today.");
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
    // If a call is already in queue for this number, request confirmation of replacement.
    console.log(`scheduleCall sessionAttributes=${sessionAttributes}`);

    const formattedPhone = PhoneNumber(slots.phone, "US").getNumber('national');

    if (request.currentIntent.confirmationStatus == "None") {
      // If the user has not previously verified that a replacement is desirable
      getActiveCallsForNumber(slots.phone).then((result) => {
        console.log("getActiveCallsForNumber ", result.Items);

        if (result.Items.length > 0) {
          // NOTE: Only support a single active call per phone number.
          // Request from the user to confirm if they would like to replace the pending call record
          if (result.Items.length > 1) throw "Multiple active calls for phone number.";

          const scheduledCall = result.Items[0];
          const dateOfCall = DateUtils.dateForEpochTime(scheduledCall.timestamp);

          sessionAttributes.prevRequest = String(JSON.stringify(scheduledCall));

          callback(LexUtils.confirmIntent(sessionAttributes, request.currentIntent.name, slots, { contentType: 'PlainText', content: `A call is already scheduled with ${formattedPhone} at ${DateUtils.dateStrForDate(dateOfCall)}. Would you like to replace it with a call around ${slots.time} on ${slots.date}?`}))
        } else {
          // No pending calls for this number, add it to the queue
          putActiveCall(slots.phone, slots.date, slots.time).then((result) => {
            if (result.err == null) {
              callback(LexUtils.closeIntent(sessionAttributes, 'Fulfilled',
              { contentType: 'PlainText', content: `Thanks! Your call has been placed in queue. We'll call you at ${formattedPhone} around ${slots.time} on ${slots.date}.`}));
            } else {
              callback(LexUtils.closeIntent(sessionAttributes, 'Failed',
              { contentType: 'PlainText', content: `Unfortunately, your request to call you at ${formattedPhone} around ${slots.time} on ${slots.date} could not be completed at this time. Please try again later.`}));
            }
          });
        }
      });
    } else if (request.currentIntent.confirmationStatus == "Denied") {
      // The user has requested that we reframe from from updating the pending call record
      callback(LexUtils.closeIntent(sessionAttributes, 'Fulfilled',
      { contentType: 'PlainText', content: `Alright. The previously configured call is remaining in the queue.`}));
    } else {
      // The user has requested that we update the pending call record
      // NOTE: DynamoDB does not allow mutations on the primary key attributes; thus, need to delete and put.
      const prevRequest = sessionAttributes.prevRequest ? JSON.parse(sessionAttributes.prevRequest) : null;

      if (prevRequest) {
        Promise.all([
          deleteCall(prevRequest.phone, prevRequest.timestamp),
          putActiveCall(slots.phone, slots.date, slots.time)
        ]).then((results) => {
          if (!results[0].err && !results[1].err) {
            callback(LexUtils.closeIntent(sessionAttributes, 'Fulfilled',
            { contentType: 'PlainText', content: `Great! The call request has been updated. We'll call you at ${formattedPhone} around ${slots.time} on ${slots.date}.`}));
          } else {
            callback(LexUtils.closeIntent(sessionAttributes, 'Failed',
            { contentType: 'PlainText', content: `Unfortunately, your request to call you at ${formattedPhone} around ${slots.time} on ${slots.date} could not be completed at this time. Please try again later.`}));
          }
        });
      } else {
        callback(LexUtils.closeIntent(sessionAttributes, 'Failed',
        { contentType: 'PlainText', content: `Unfortunately, your request to call you at ${formattedPhone} around ${slots.time} on ${slots.date} could not be completed at this time. Please try again later.`}));
      }
    }
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
