'use strict';

// Mongoose models index
const User = require('./user');
const Property = require('./property');
const Client = require('./client');
const ClientRole = require('./clientRole');
const Referral = require('./referral');
const Task = require('./task');
const Thread = require('./thread');
const Message = require('./message');
const Photo = require('./photo');

module.exports = {
  User,
  Property,
  Client,
  ClientRole,
  Referral,
  Task,
  Thread,
  Message,
  Photo
};
