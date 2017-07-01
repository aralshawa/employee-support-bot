/*
 * Date and Time Formatting and Translation Utilities
 */

 function dateForDateString(dateStr) {
   // Assuming the standard YYY-MM-DD date format, parse the string and construct a date object
   // A null return indicates a failure to parse the string
   try {
     if (!dateStr) throw "Unspecified date string.";

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
     if (!dateStr) throw "Unspecified date string.";

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
     if (!epochSec) throw "Unspecified epoch time.";

     var date = new Date(0); // The 0 there is the key, which sets the date to the epoch
     date.setUTCSeconds(epochSec);

     return date;
   } catch (error) {
     return null;
   }
 }

 function dateStrForDate(date) {
   try {
     if (!date) throw "Unspecified date.";

     let day = ("0" + date.getDate()).slice(-2);
     let mon = ("0" + (date.getMonth() + 1)).slice(-2);
     let yr = date.getFullYear();
     let hr = date.getHours();
     let min = ("0" + date.getMinutes()).slice(-2);

     return `${day}-${mon}-${yr} ${hr}:${min} GMT`;
   } catch (error) {
     return null;
   }
 }

 module.exports = {
   dateForDateString, dateForDateTimeStrTuple, dateForEpochTime, dateStrForDate
 }
