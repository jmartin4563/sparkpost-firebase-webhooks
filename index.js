var Firebase = require('firebase')
  , FirebaseTokenGenerator = require('firebase-token-generator')
  , uuid = require('node-uuid')
  , _ = require('lodash');

/*
 * Constructor method for creating our demo event processor
 */
var SparkyFire = function() {
  var self = this;

  if (!process.env.FIREBASE_URL || !process.env.FIREBASE_SECRET) {
    console.error('Please set the URL and Secret of your Firebase instance as an environment variables!');
    process.exit(-1);
  }

  this.db = new Firebase(process.env.FIREBASE_URL);
  this.tokenGenerator = new FirebaseTokenGenerator(process.env.FIREBASE_SECRET);

  // Create a JWT token for our process (https://www.firebase.com/docs/rest/guide/user-auth.html#section-token-generation)
  this.token = this.tokenGenerator.createToken({uid: uuid.v4(), type: 'webhook-processing'});

  this.db.authWithCustomToken(this.token, function(err) {
    if (err) {
      console.error('Unable to authenticate with your Firebase instance!', err);
      process.exit(-1);
    } else {
      self.readPreviousBatches();
      self.listenForBatches();
    }
  });
};

SparkyFire.prototype.readPreviousBatches = function() {
  var self = this;
  console.log('Reading batches that came in while we were down...');

  // `value` returns the entire listing at one time
  this.db.child('raw-events').once('value', function(batches) {
    _.forOwn(batches.val(), function(batch, key) {
      self.processBatch(batch);
      self.db.child('raw-events').child(key).remove();
    });

    console.log('Finished replay, waiting for new batches...');
  });
};

SparkyFire.prototype.listenForBatches = function() {
  var self = this;

  this.db.child('raw-events').on('child_added', function(batch) {
    self.processBatch(batch.val());
    self.db.child('raw-events').child(batch.key()).remove();
  });
};

SparkyFire.prototype.processBatch = function(batch) {
  var self = this;

  _.forEach(batch, function(event) {
    var eventGrouping = _.keys(event.msys)[0]
      , eventType = event.msys[eventGrouping].type
      , processFunction = self.processEvent(eventType);

    processFunction(event.msys[eventGrouping]);
  });
};

SparkyFire.prototype.processEvent = function(eventType) {
  var self = this;

  var mapping = {
    delay: self.processDelayEvent,
    bounce: self.processBounceEvent,
    delivery: self.processDeliveryEvent,
    injection: self.processInjectionEvent,
    sms_status: self.processSmsStatusEvent,
    spam_complaint: self.processSpamComplaintEvent,
    out_of_band: self.processOutOfBandEvent,
    policy_rejection: self.processPolicyRejectionEvent,
    click: self.processClickEvent,
    open: self.processOpenEvent,
    relay_injection: self.processRelayInjectionEvent,
    relay_rejection: self.processRelayRejectionEvent,
    relay_delivery: self.processRelayDeliveryEvent,
    relay_tempfail: self.processRelayTempfailEvent,
    relay_permfail: self.processRelayPermfailEvent,
    generation_failure: self.processGenerationFailureEvent,
    generation_rejection: self.processGenerationRejectionEvent,
    list_unsubscribe: self.processListUnsubscribeEvent,
    link_unsubscribe: self.processLinkUnsubscribeEvent
  };

  return mapping[eventType];
};

SparkyFire.prototype.processDelayEvent = function(event) {};

SparkyFire.prototype.processBounceEvent = function(event) {};

SparkyFire.prototype.processDeliveryEvent = function(event) {};

SparkyFire.prototype.processInjectionEvent = function(event) {};

SparkyFire.prototype.processSmsStatusEvent = function(event) {};

SparkyFire.prototype.processSpamComplaintEvent = function(event) {};

SparkyFire.prototype.processOutOfBandEvent = function(event) {};

SparkyFire.prototype.processPolicyRejectionEvent = function(event) {};

SparkyFire.prototype.processClickEvent = function(event) {};

SparkyFire.prototype.processOpenEvent = function(event) {};

SparkyFire.prototype.processRelayInjectionEvent = function(event) {};

SparkyFire.prototype.processRelayRejectionEvent = function(event) {};

SparkyFire.prototype.processRelayDeliveryEvent = function(event) {};

SparkyFire.prototype.processRelayTempfailEvent = function(event) {};

SparkyFire.prototype.processRelayPermfailEvent = function(event) {};

SparkyFire.prototype.processGenerationFailureEvent = function(event) {};

SparkyFire.prototype.processGenerationRejectionEvent = function(event) {};

SparkyFire.prototype.processListUnsubscribeEvent = function(event) {};

SparkyFire.prototype.processLinkUnsubscribeEvent = function(event) {};

module.exports = new SparkyFire();
