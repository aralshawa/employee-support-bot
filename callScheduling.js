/*
 * TODO
 */

var Promise = require('bluebird'),
    PhoneNumber = require('awesome-phonenumber'),
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

function validationResult(valid, violatedSlot, message) {
  return {
    valid, violatedSlot, message
  };
}

function validateCall(slots) {
  const name = slots.name, phone = slots.phone, date = slots.date, time = slots.time;

  // Validate 'name'
  if (name.length == 0) {
    return validationResult(false, "name", "Please specify your name for our records.");
  }

  // Validate 'phone'
  let parsedPhone = PhoneNumber(phone);
  if (!parsedPhone.isValid()) {
    return validationResult(false, "phone", `The number "${parsedPhone.getNumber()}" is not valid. Please specify a different number.`);
  }

  // Validate 'date'
  var parsedDate = dateForDateString(date);
  if (parsedDate) {
    if (parsedDate < new Date()) {
      // If the provided date that is in the past
      return validationResult(false, "date", "Please specifiy a date that is today or in the future.");
    }
  } else {
    return validationResult(false, "date", "I could not comprehend the provided date. Can you please respecify it?");
  }

  // Validate 'time'
  if (time) {
    var timeComponents = time.split(":");
    parsedDate.hours = timeComponents[0];
    parsedDate.minutes = timeComponents[1];

    if (parsedDate < new Date()) {
      // If the provided time that is in the past
      return validationResult(false, "date", "Please specifiy a time later today.");
    }
  }

  return {valid: true};
}

/*
 * Intent Fulfilment
 */

function scheduleCall(request, callback) {
  // TODO: Method Stub
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
