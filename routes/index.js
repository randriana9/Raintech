var express = require('express');
var router = express.Router();
var request = require('request');

const VERIFY_TOKEN = 'MY_FITIA_TOKEN';

const PAGE_ACCESS_TOKEN = 'EAAJ08ZCPjCMEBAPZBc8jSJ1DGEh0GspidUgZAsg9yqaZB8uresPw6oiyg3P6CGkt8ddccjxjgjWErI7pepN71qd8mOZBALeN9czvUCRkmcHtYv9yZAUB7iGZAfeZAkaMsKf2X7fQEJ5CViiDVp8K0u2mgvz3LlirCaLoBAOtzLjGmwZDZD';

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendStatus(410);
});

router.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === VERIFY_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }  
});

router.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});
  
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {

    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText.toLowerCase()) {
      case 'generic':
        sendGenericMessage(senderID);
        break;
      case 'sandviken wifi':
        sendWifiMessage(senderID, "sandviken");
        break;
      case "cresco code":
        sendCodeMessage(senderID, "cresco");
        break;

      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function sendGenericMessage(recipientId, messageText) {
  // To be expanded in later sections
}

function sendWifiMessage( recipientId, place ) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "Askim1831"
    }
  };

  callSendAPI(messageData);
}

function sendCodeMessage( recipientId, type ) {
  let code;

  switch( type ) {
    case "cresco":
      code = "3598";
      break;
  }

  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: code
    }
  };

  callSendAPI(messageData);

}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });
}

module.exports = router;
