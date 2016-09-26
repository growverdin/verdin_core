function MessageParser() {}

function MessageObj() {
	this.deviceMacAddress = "";
	this.messageString = "";
	this.linkedSensorsPerDevice = new Array();
	this.responsesPerDevice = new Array();
}

MessageParser.parseLinkedSensorsToMessageObjArray = function(linkedSensors) {
	var messageArray = new Array();
	var messageObj = new MessageObj();
	var tempSensorType;

	for (var i = 0 ; i < linkedSensors.length ; i++) {
		if (messageObj.deviceMacAddress != linkedSensors[i].device.macAddress) {
			//if finds a new device, adds the previous message
			if (i != 0) {
				messageArray.push(messageObj);
			}

			//prepare for a new messageObj
			messageObj = new MessageObj();
			messageObj.deviceMacAddress = linkedSensors[i].device.macAddress;
			tempSensorType = "";
		}

		//adds the actual linked sensor
		messageObj.linkedSensorsPerDevice.push(linkedSensors[i]);

		//adds the type of the sensor
		if (typeOfSensor != linkedSensors[i].senAct.id) {
			//adds separator if finds a new type of sensor
			if (typeOfSensor != "") {
				messageObj.messageString += "/";
			}
			typeOfSensor = linkedSensors[i].senAct.id;
			messageObj.messageString += typeOfSensor;
		}

		//adds the port of the sensor
		messageObj.messageString += "-" + linkedSensors[i].readPort.value;

		//if it's the last one, adds the message
		if (i == linkedSensors.length -1) {
			messageArray.push(messageObj);
		}
	}

	return messageArray;
};