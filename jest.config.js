/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
/* eslint-disable */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleDirectories: ['node_modules', 'src'],
  moduleNameMapper: {
    "firebase-admin/app": "firebase-admin/lib/app",
    "firebase-admin/firestore": "firebase-admin/lib/firestore"
  }
};
