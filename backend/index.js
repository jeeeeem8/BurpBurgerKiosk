const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { app, initializeBackend } = require('./server');

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.api = functions
  .region('us-central1')
  .runWith({ timeoutSeconds: 300, memory: '1GB' })
  .https.onRequest(async (req, res) => {
    await initializeBackend();
    return app(req, res);
  });