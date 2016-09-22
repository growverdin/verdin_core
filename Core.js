var Server = require('./Server');
var NodeCommunicator = require('./NodeCommunicator');
var MessageParser = require('./MessageParser');

//initialize Server
var server = new Server();

//initialize NodeCommunicator
var nodeCommunicator = new NodeCommunicator();

//start with a measurement
var isMeasurement = true;

var executeMeasurements = function() {
	server.getLinkedSensors(function(linkedSensors) {
		//parses list of linked sensors in array of messageObj format
		var messageList = MessageParser.parseLinkedSensorsToMessageObjArray(linkedSensors);

		//adds each message to be sent
		for (message in messageList) {
			nodeCommunicator.addMessage(message);
		}

		//REVIEW THIS
		nodeCommunicator.communicate(Server.addMeasurement(measurement));
	});
};

var executeActions = function() {

};

var execution = function() {
	//measurement turn
	if (isMeasurement) {
		executeMeasurements();
	}

	//action turn
	else {
		executeActions();
	}

	//change turn
	isMeasurement = !isMeasurement;
};

//executes every 5 minutes
setInterval(execution, 3000);