var execCount = 0;

var colors = require('colors');

var Server = require('./Server');
var NodeCommunicator = require('./NodeCommunicator');
var MessageParser = require('./MessageParser');

//define execution interval
var execInterval = 120000;

//define NodeCommunicator timeouts
var scanTimeout = 40000;
var connectAndDiscoverTimeout = 20000;
var communicationTimeout = 55000;

//initialize Server
var server = new Server();

//initialize NodeCommunicator
var nodeCommunicator = new NodeCommunicator(scanTimeout, connectAndDiscoverTimeout, communicationTimeout);

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
				for (var i = 0 ; i < messageObj.linkedSenActPerDevice.length ; i++) {
					//pair each linked sensor with its measurement value
					var measurementObj = {
						linkedSensor: messageObj.linkedSenActPerDevice[i],
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
	//gets list of actions to be executed from the cloud
	server.getLinkedActuatorsActions(function(linkedActuatorsActions) {
		//if has linked sensors
		if (linkedActuatorsActions.length > 0) {
            //parses list of linked sensors in array of messageObj format
            var messageList = messageParser.parseLinkedActuatorsActionsToMessageObjArray(linkedActuatorsActions);

            //adds each message to be sent
            for (message in messageList) {
            	nodeCommunicator.addMessage(messageList[message]);
            }

            //start communication and adds callback to be executed on response of each node
            nodeCommunicator.communicate(function(messageObj) {
                for (var i = 0 ; i < messageObj.linkedSenActPerDevice.length ; i++) {
                    //pair each linked actuator with its actuation value
                    var actuationObj = {
                        linkedActuator: messageObj.linkedSenActPerDevice[i],
                        value: messageObj.responsesPerDevice[i]
                    };

                    //sends each of the actuations to the cloud
                    server.addActuation(actuationObj);
                }
            });
        }
    });
};

var execution = function() {
	execCount++;

	if (execCount > 2) {
		console.log("Restarting!!!");
		console.log(restart);
	}

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
