var mqtt = require('mqtt');
var fs   = require('fs');

var options = {
    requestCert: true,
    rejectUnauthorized: true,
    protocol: 'mqtt',
    port: 8883,
    host: 'A834FOF6C3XKD.iot.ap-northeast-1.amazonaws.com',
    key: fs.readFileSync('./4e1c79ab8e-private.pem.key'),
    cert: fs.readFileSync('./4e1c79ab8e-certificate.pem.crt'),
    ca: [fs.readFileSync('./root-CA.crt')]
};

exports.handler = function (event, context) {
    
    try {

        console.log("event.session.application.applicationId=" + event.session.application.applicationId);
        console.log('1.4');

        var topic = "$aws/things/abot-one/shadow/update";

        var intent     = event.request.intent,
            intentName = event.request.intent.name,
	    cardTitle  = intentName;

        var sessionAttributes = {};
        var shouldEndSession = false;

        var repromptText = "";
        var speechOutput = "";

	var botStatusValue = -1;
        
        switch(intentName) 
        {
	    case "MoveStraightSpiderIntent":

	    botStatusValue = 1;
            speechOutput   = "Ok, spider will go straight.";
	    
	    break;

	    case "MoveBackSpiderIntent":
	    
	    botStatusValue = 2;
            speechOutput   = "Ok, spider will move back.";
            
	    break;

            case "SitdownSpiderIntent":

	    botStatusValue = 7;
            speechOutput   = "Ok, spider will sit down";

	    // session end in sitdown action
	    shouldEndSession = true; 
            
            break;
	    
            case "StandupSpiderIntent":

	    botStatusValue = 6;
            speechOutput   = "Ok, spider will stand up.";
            
            break;
            
            
            default:
            throw "Invalid intent";
            break;
        }

	//--- update IoT
        var client = mqtt.connect(options);
        client.on('connect', function (err) {
            client.publish(topic, "{ \"state\": {\"desired\": {\"botStatusValue\": "+ botStatusValue +" } } }");
            client.end();
            context.succeed(buildResponse(sessionAttributes,
	        			  buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession)));
        });

    } catch (e) {
        context.fail("Exception: " + e);
    }
};

function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
		", sessionId=" + session.sessionId);
}

function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
		", sessionId=" + session.sessionId);
    getWelcomeResponse(callback);
}

function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
		", sessionId=" + session.sessionId);
}

function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
		", sessionId=" + session.sessionId);

}

// --------------- Functions that control the skill's behavior -----------------------
function getWelcomeResponse(callback) {
    
    var sessionAttributes = {};
    var cardTitle         = "Welcome";
    var speechOutput      = "Welcome to the Abot Skills Kit, " +
        "Please tell me your command by saying, " +
        "stand up, sit down, go straight or go back.";
    

    var repromptText     = "Please tell me your command by saying, stand up, sit down, go straight or move back.";
    var shouldEndSession = false;

    callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
