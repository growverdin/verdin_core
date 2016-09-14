var Server = require('./Server');
var NodeCommunicator = require('./NodeCommunicator');

//start with a measurement
var isMeasurement = true;

var executeMeasurements = function() {
	Server.getLinkedSensors(function(linkedSensors) {
		//CONTINUE HERE...

		//REVIEW THIS
		//for each message
		NodeCommunicator.addMessage(message);

		//REVIEW THIS
		NodeCommunicator.communicate(Server.addMeasurement(measurement));
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
setInterval(execution, 300000);