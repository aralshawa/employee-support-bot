/*
 * AWS DynamoDB Request Costruction Utilities
 */

var Promise = require('bluebird'),
    AWS = require('aws-sdk');

// Create a promisified version of the docClient
var docClient = Promise.promisifyAll(new AWS.DynamoDB.DocumentClient())

module.exports = {
  client: docClient
}
