var Firebase = require('firebase')
  , FirebaseTokenGenerator = require('firebase-token-generator')
  , uuid = require('node-uuid')
  , _ = require('lodash');

var SparkyQuery = function() {
  var self = this;

  this.db = new Firebase(process.env.FIREBASE_URL);
  this.tokenGenerator = new FirebaseTokenGenerator(process.env.FIREBASE_SECRET);
  this.token = this.tokenGenerator.createToken({uid: uuid.v4(), type: 'webhook-processing'});
  this.db.authWithCustomToken(this.token, function(err) {
    if (err) {
      console.error('Unable to authenticate with your Firebase instance!', err);
      process.exit(-1);
    } else {
      var clicks = self.db.child('clicks');
      clicks.orderByChild('geo_ip/country').equalTo('US').on('value', function(results) {
        console.log('Clicks from US Region');
        console.log('------------------------------------')
        _.forOwn(results.val(), function(event) {
          console.log('Recipient:', event.rcpt_to);
          console.log('Campaign:', event.campaign_id);
          console.log('Template:', event.template_id);
          console.log('User-Agent:', event.user_agent);
          console.log('------------------------------------')
        });
        process.exit(0);
      });
    }
  });
};

module.exports = new SparkyQuery();
