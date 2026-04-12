'use strict';

const { createRequire } = require('module');
const path = require('path');

// Load seed data relative to this file
const seedData = require('../seed-data.json');

let registerSeq = 0;

function pickRandomUser(context, events, done) {
  const users = seedData.users;
  const randomUser = users[Math.floor(Math.random() * users.length)];
  context.vars.userToken = randomUser.token;
  context.vars.userId = randomUser.userId;
  context.vars.userEmail = randomUser.email;
  return done();
}

function pickRandomCourse(context, events, done) {
  const courseIds = seedData.courseIds;
  context.vars.courseId = courseIds[Math.floor(Math.random() * courseIds.length)];
  return done();
}

function pickRandomArticle(context, events, done) {
  const articleIds = seedData.articleIds;
  context.vars.articleId = articleIds[Math.floor(Math.random() * articleIds.length)];
  return done();
}

function getTodayDate(context, events, done) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  context.vars.todayDate = `${year}-${month}-${day}`;
  return done();
}

function getCurrentMonth(context, events, done) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  context.vars.currentMonth = `${year}-${month}`;
  return done();
}

function buildUniqueRegisterUser(context, events, done) {
  registerSeq += 1;
  const suffix = [
    Date.now().toString(36),
    process.pid,
    registerSeq,
    Math.floor(Math.random() * 1e9).toString(36),
  ].join('_');

  context.vars.registerUsername = `load_${suffix}`;
  context.vars.registerEmail = `load_${suffix}@perf.com`;
  return done();
}

module.exports = {
  pickRandomUser,
  pickRandomCourse,
  pickRandomArticle,
  getTodayDate,
  getCurrentMonth,
  buildUniqueRegisterUser,
};