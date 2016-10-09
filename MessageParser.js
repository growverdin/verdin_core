var MessageParser = function() {

	console.log("\nMessageParser Initialized.");

};

var MessageObj = function() {
	this.deviceMacAddress = "";
	this.messageString = "";
	this.linkedSenActPerDevice = new Array();
	this.responsesPerDevice = new Array();
};

MessageParser.prototype.parseLinkedSensorsToMessageObjArray = function(linkedSensors) {
	var messageArray = new Array();
	var messageObj = new MessageObj();
	var tempSensorType;

	for (var i = 0 ; i < linkedSensors.length ; i++) {
		if (messageObj.deviceMacAddress != linkedSensors[i].device.macAddress) {
			//if finds a new device, adds the previous message
			if (i != 0) {
				messageObj.messageString += "/*";
				messageArray.push(messageObj);
			}

			//prepare for a new messageObj
			messageObj = new MessageObj();
			messageObj.deviceMacAddress = linkedSensors[i].device.macAddress;
			tempSensorType = "";
		}

		//adds the actual linked sensor
		messageObj.linkedSenActPerDevice.push(linkedSensors[i]);

		//adds the type of the sensor
		if (tempSensorType != linkedSensors[i].senAct.id) {
			//adds separator if finds a new type of sensor
			if (tempSensorType != "") {
				messageObj.messageString += "/";
			}
			tempSensorType = linkedSensors[i].senAct.id;
			messageObj.messageString += tempSensorType;
		}

		//adds the port of the sensor
		messageObj.messageString += "#" + linkedSensors[i].readPort.value;

		//if it's the last one, adds the message
		if (i == linkedSensors.length -1) {
			messageObj.messageString += "/*";
			messageArray.push(messageObj);
		}
	}

	return messageArray;
};

MessageParser.prototype.parseLinkedActuatorsActionsToMessageObjArray = function(linkedActuatorsActions) {
	var messageArray = new Array();
	var messageObj = new MessageObj();
	var tempActuatorType;

	for (var i = 0 ; i < linkedActuatorsActions.length ; i++) {
		if (messageObj.deviceMacAddress != linkedActuatorsActions[i].linkedActuator.device.macAddress) {
			//if finds a new device, adds the previous message
			if (i != 0) {
				messageObj.messageString += "/*";
				messageArray.push(messageObj);
			}

			//prepare for a new messageObj
			messageObj = new MessageObj();
			messageObj.deviceMacAddress = linkedActuatorsActions[i].linkedActuator.device.macAddress;
			tempActuatorType = "";
		}

		//adds the actual linked actuator
		messageObj.linkedSenActPerDevice.push(linkedActuatorsActions[i].linkedActuator);

		//adds the type of the actuator
		if (tempActuatorType != linkedActuatorsActions[i].linkedActuator.senAct.id) {
			//adds separator if finds a new type of sensor
			if (tempActuatorType != "") {
				messageObj.messageString += "/";
			}
			tempActuatorType = linkedActuatorsActions[i].linkedActuator.senAct.id;
			messageObj.messageString += tempActuatorType;
		}

		//adds the port of the actuator
		messageObj.messageString += "#" + linkedActuatorsActions[i].linkedActuator.port.value;

		//adds the value of the actuation
		messageObj.messageString += "?" + linkedActuatorsActions[i].value;

		//if it's the last one, adds the message
		if (i == linkedActuatorsActions.length -1) {
			messageObj.messageString += "/*";
			messageArray.push(messageObj);
		}
	}

	return messageArray;
};

module.exports = MessageParser;
