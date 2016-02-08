var Firebase = require('firebase')
  , FirebaseTokenGenerator = require('firebase-token-generator')
  , uuid = require('node-uuid')
  , _ = require('lodash')
  , self;

/*
 * Constructor method for creating our demo event post-processor
 */
var SparkyFire = function() {
  self = this;

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
  console.log('Reading batches that came in while we were down...');

  // `value` returns the entire listing at one time
  this.db.child('raw-events').once('value', function(batches) {
    _.forOwn(batches.val(), function(batch, key) {
      self.processBatch(batch);
      // Uncomment if you don't want the raw events after post-processing
      // self.db.child('raw-events').child(key).remove();
    });

    console.log('Finished replay, waiting for new batches...');
  });
};

SparkyFire.prototype.listenForBatches = function() {
  this.db.child('raw-events').on('child_added', function(batch) {
    self.processBatch(batch.val());
    // Uncomment if you don't want the raw events after post-processing
    // self.db.child('raw-events').child(batch.key()).remove();
  });
};

SparkyFire.prototype.processBatch = function(batch) {
  _.forEach(batch, function(event) {
    var eventGrouping = _.keys(event.msys)[0]
      , eventType = event.msys[eventGrouping].type
      , processFunction = self.processEvent(eventType);

    processFunction(event.msys[eventGrouping]);
  });
};

SparkyFire.prototype.processEvent = function(eventType) {
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

/**
 * Below are some examples of ways you can post-process your data after the
 * Webhooks store them in an initial Firebase bucket.
 *
 * In this case, we've added post-processing that stores hard bounces, spam
 * complaints and unsubscribes to add them to a smaller bucket called `list-cleanup`.
 * In SparkPost, these types of events will result in a recipient being added to your
 * suppression list. So if a recipient has been suppressed, you should do some list
 * cleaning to make sure your recipient lists only have people who want to get emails
 * from you.
 *
 * We've also added some post-processing for rejections events. Rejection events mean
 * that during the email creation/sending, there was an error. This means that your
 * recipient never got their email, so we store these events into an `errors` bucket
 * for your review.
 *
 * Finally, we also post-process opens and click events into an `engagement` bucket.
 * Opens and clicks are good indicators that what you're sending to your recipients
 * is pertinent and interesting to them.
 *
 * Notice that we're not post-processing _all_ of our events, but for convenience,
 * we've stubbed out methods for each event type for you to modify to fit your data
 * needs. You're also not restricted to just storing the events in Firebase, you
 * could trigger a slack notification, or update an entry in your CRM system, whatever.
 * That's the power of webhooks!
 */
SparkyFire.prototype.processDelayEvent = function(event) {};

SparkyFire.prototype.processBounceEvent = function(event) {
  var bounceClass = event.bounce_class;

  if ([10, 60, 90].indexOf(bounceClass) !== -1) {
    self.db.child('list-cleanup/' + event.message_id).set(event);
  }
};

SparkyFire.prototype.processDeliveryEvent = function(event) {};

SparkyFire.prototype.processInjectionEvent = function(event) {};

SparkyFire.prototype.processSmsStatusEvent = function(event) {};

SparkyFire.prototype.processSpamComplaintEvent = function(event) {
  self.db.child('list-cleanup/' + event.message_id).set(event);
};

SparkyFire.prototype.processOutOfBandEvent = function(event) {};

SparkyFire.prototype.processPolicyRejectionEvent = function(event) {
  self.db.child('errors/' + event.message_id).set(event);
};

SparkyFire.prototype.processClickEvent = function(event) {
  self.db.child('engagement/' + event.message_id).set(event);
};

SparkyFire.prototype.processOpenEvent = function(event) {
  self.db.child('engagement/' + event.message_id).set(event);
};

SparkyFire.prototype.processRelayInjectionEvent = function(event) {};

SparkyFire.prototype.processRelayRejectionEvent = function(event) {};

SparkyFire.prototype.processRelayDeliveryEvent = function(event) {};

SparkyFire.prototype.processRelayTempfailEvent = function(event) {};

SparkyFire.prototype.processRelayPermfailEvent = function(event) {};

SparkyFire.prototype.processGenerationFailureEvent = function(event) {
  self.db.child('errors/' + event.message_id).set(event);
};

SparkyFire.prototype.processGenerationRejectionEvent = function(event) {
  self.db.child('errors/' + event.message_id).set(event);
};

SparkyFire.prototype.processListUnsubscribeEvent = function(event) {
  self.db.child('list-cleanup/' + event.message_id).set(event);
};

SparkyFire.prototype.processLinkUnsubscribeEvent = function(event) {
  self.db.child('list-cleanup/' + event.message_id).set(event);
};

module.exports = new SparkyFire();
