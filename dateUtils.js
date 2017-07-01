/*
 * Date and Time Formatting and Translation Utilities
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

 module.exports = {
   dateForDateString, dateForDateTimeStrTuple, dateForEpochTime, dateStrForDate
 }
