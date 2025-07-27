'use strict';

// Mongoose models index
const User = require('./user');
const Property = require('./property');
const Client = require('./client');
const Task = require('./task');
const Thread = require('./thread');
const Message = require('./message');
const Photo = require('./photo');

module.exports = {
  User,
  Property,
  Client,
  Task,
  Thread,
  Message,
  Photo
};
