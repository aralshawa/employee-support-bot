Intents
============

ScheduleCall
------------
**Example**  Can you call me at (519) 123-4567 today at 1:00 pm? <br/>
**Slots**  phone, date, time

###### Notable Validations
- Validate that only one outstanding request can be made per phone number
- If call already scheduled with phone number, ask user if they would like to replace it.
- Validate time is within hours of operation

###### Future Work
  - Describing the nature of the call request. Add *type* slot (e.x. payroll, health, discounts, insurance).

###### Limitations
  - Due to privacy concerns, cannot get TZ implicitly. Need to request it ourselves. What's a natural mechanism for this? Maybe just use the default timezone of the call center (GMT/UST)?
  - Cannot request an arbitrary string from the user (such as a name) for privacy reasons.

###### Fragment Sample
  ```json
  {
    "phone": 5191234567,
    "timestamp": 1500595200,
    "callID": "887cbc50959dda67c53f419434e32504",
    "requested": 1500509151,
    "status": 0,
    "timezone": "GMT"
  }
  ```
  `callID` is an MD5 hash of the numeric phone number and timestamp. <br/>
  `timestamp` and `requested` are epoch timestamps (seconds)

CallStatus
------------
**Example**  What is the status of my call? <br/>
**Slots**  phone

###### Call States
  ```
  -10 Cancelled
   0  Queued
   10 Attempted, Failed to Reach, and Rescheduled
   20 Attempted, Failed to Reach, and Prompt user to reschedule
   50 Attempted and Fulfilled
  ```

BusinessInfo
------------
**Example**  What are your *hours*? <br/>
**Slots**  type

- Static data query from database (e.x. business hours, locations)

Gratitude
------------
An intent to respond with gratitude or acknowledge such emotion from the user.

Greeting
------------
An intent to respond to a greeting from the user with one of its own.


******


*Prototype:* Get next scheduled call
------------
- Based on the current time, fetches the next request that is past its deadline OR is within 15 min of requested timeframe. Fetches phone number, nature of the question, date/time.
- Initiates phone call via Twilio and routes between the support agent and client.
- If the client could not be reached, updated status, reschedule for 30 min later (only once).

*Prototype:* Submit Checkin/Checkout
------------
**Slots** <br/>
Optional: time (if none specified, assume 'now') <br/>
Optional: employeeId

- Punch in and out time cards → auto
- Timecard review for the current user
- Utilize 'userId' input event parameter
- Check database for userId to employeeId mapping
  - If none exists, prompt for employeeId
- If an employeeId is stored in the session and has not been 'verified', send an auth token via text (Twilio module) and prompt user for value
  - Send text to employee cell on file
  - Store in database if userId has been verified to act on employeeId (reset after some time)
  - If the employeeId does not have a cell number on file, reject intent attempt
