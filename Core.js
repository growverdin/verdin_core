var colors = require('colors');

var Server = require('./Server');
var NodeCommunicator = require('./NodeCommunicator');
var MessageParser = require('./MessageParser');

//define execution interval
var execInterval = 20000;//300000;

//define NodeCommunicator timeouts
var scanTimeout = 3000;
var communicationTimeout = 15000;//240000;

//initialize Server
var server = new Server();

//initialize NodeCommunicator
var nodeCommunicator = new NodeCommunicator(scanTimeout, communicationTimeout);

//initialize MessageParser
var messageParser = new MessageParser();

//start with a measurement
var isMeasurement = true;

var executeMeasurements = function() {
	//gets list of linked sensors from the cloud
	server.getLinkedSensors(function(linkedSensors) {
		//if has linked sensors
		if (linkedSensors.length > 0) {
			//parses list of linked sensors in array of messageObj format
			var messageList = messageParser.parseLinkedSensorsToMessageObjArray(linkedSensors);

			//adds each message to be sent
			for (message in messageList) {
				nodeCommunicator.addMessage(messageList[message]);
			}

			//start communication and adds callback to be executed on response of each node
			nodeCommunicator.communicate(function(messageObj) {
				for (var i = 0 ; i < messageObj.linkedSensorsPerDevice.length ; i++) {
					//pair each linked sensor with its measurement value
					var measurementObj = {
						linkedSensor: messageObj.linkedSensorsPerDevice[i],
						value: messageObj.responsesPerDevice[i]
					};

					//sends each of the measurements to the cloud
					server.addMeasurement(measurementObj);
				}
			});
		}
	});
};

var executeActions = function() {

	// TO BE DONE NOW..........

	/*
	//gets list of actions to be executed from the cloud
        server.getLinkedSensors(function(linkedSensors) {
		//if has linked sensors
                if (linkedSensors.length > 0) {
                        //parses list of linked sensors in array of messageObj format
                        var messageList = messageParser.parseLinkedSensorsToMessageObjArray(linkedSensors);

                        //adds each message to be sent
                        for (message in messageList) {
                                nodeCommunicator.addMessage(messageList[message]);
                        }

                        //start communication and adds callback to be executed on response of each node
                        nodeCommunicator.communicate(function(messageObj) {
                                for (var i = 0 ; i < messageObj.linkedSensorsPerDevice.length ; i++) {
                                        //pair each linked sensor with its measurement value
                                        var measurementObj = {
                                                linkedSensor: messageObj.linkedSensorsPerDevice[i],
                                                value: messageObj.responsesPerDevice[i]
                                        };

                                        //sends each of the measurements to the cloud
                                        server.addMeasurement(measurementObj);
                                }
                        });
                }
	});
*/
};

var execution = function() {
	//just start another execution if the previous has finished
	if (!nodeCommunicator.isBusy) {
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
	}
};

//executes every 5 minutes
setInterval(execution, execInterval);
