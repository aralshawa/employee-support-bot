/*
 * Lex Response Construction Utilities
 */

const LEX_ELICIT_SLOT = "ElicitSlot"
const LEX_CONFIRM_INTENT = "ConfirmIntent"
const LEX_CLOSE_INTENT = "Close"
const LEX_DELEGATE_RESPONSE = "Delegate"

function lexResponse(sessionAttributes, type, options) {
  return {
      sessionAttributes,
      dialogAction: {
          type,
          ...options
      },
  };
}

function elicitSlotForIntent(sessionAttributes, intentName, slots, slotToElicit, message) {
  return lexResponse(sessionAttributes, LEX_ELICIT_SLOT, {
    intentName, slots, slotToElicit, message
  });
}

function confirmIntent(sessionAttributes, intentName, slots, message) {
  return lexResponse(sessionAttributes, LEX_CONFIRM_INTENT, {
    intentName, slots, message
  });
}

function closeIntent(sessionAttributes, fulfillmentState, message) {
  return lexResponse(sessionAttributes, LEX_CLOSE_INTENT, {
    fulfillmentState, message
  });
}

function delegateResponse(sessionAttributes, slots) {
  return lexResponse(sessionAttributes, LEX_DELEGATE_RESPONSE, {
    slots
  });
}

exports = {
  elicitSlotForIntent, confirmIntent, closeIntent, delegateResponse
}
