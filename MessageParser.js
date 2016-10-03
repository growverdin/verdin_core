var MessageParser = function() {

	console.log("\nMessageParser Initialized.");

};

var MessageObj = function() {
	this.deviceMacAddress = "";
	this.messageString = "";
	this.linkedSensorsPerDevice = new Array();
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
		messageObj.linkedSensorsPerDevice.push(linkedSensors[i]);

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
		messageObj.messageString += "-" + linkedSensors[i].readPort.value;

		//if it's the last one, adds the message
		if (i == linkedSensors.length -1) {
			messageObj.messageString += "/*";
			messageArray.push(messageObj);
		}
	}

	return messageArray;
};

module.exports = MessageParser;
