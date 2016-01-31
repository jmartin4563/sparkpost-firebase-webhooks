var Firebase = require('firebase')
  , FirebaseTokenGenerator = require('firebase-token-generator')
  , uuid = require('node-uuid')
  , _ = require('lodash')
  , moment = require('moment');

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
      var clicks = self.db.child('clicks')
        , dayAgo = moment().subtract(24, 'hours').unix()
        , now = moment().unix();

      console.log(dayAgo);
      console.log(now);
      clicks.orderByChild('timestamp').startAt(dayAgo.toString()).endAt(now.toString()).on('value', function(results) {
        console.log('Clicks from US Region in the Last 24 Hours');
        console.log('------------------------------------')
        _.forOwn(results.val(), function(event) {
            if (event.geo_ip && event.geo_ip.country === 'US') {
              console.log('Recipient:', event.rcpt_to);
              console.log('Campaign:', event.campaign_id);
              console.log('Template:', event.template_id);
              console.log('User-Agent:', event.user_agent);
              console.log('------------------------------------')
            }
        });
        process.exit(0);
      });
    }
  });
};

module.exports = new SparkyQuery();
