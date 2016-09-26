var noble = require('noble');

//REVIEW THIS
function NodeCommunicator() {
	this.messageList = new Array();
	this.isBusy = false;
	this.callback = function() {};
	
	noble.on('stateChange', function(state) {
		console.log("\n*** Bluetooth Low Energy has changed to state: " + state + " ***");
	});

	noble.on('discover', onDiscoverDevice);
}

NodeCommunicator.prototype.addMessage = function(messageObj) {
	//adds message with status pending
	messageObj.status = "pending";
	this.messageList.push(messageObj);
};

NodeCommunicator.prototype.communicate = function(callback) {
/*
	ALWAYS REMEMBER: JUST 5 SIMULTANEOUS CONNECTIONS
*/
	if (noble.state === "poweredOn") {
		this.isBusy = true;
		this.callback = callback;
		noble.startScanning();
	} else {
		console.log("\n*** Error trying to communicate! Bluetooth Low Energy is not powered on! ***");
	}
};

NodeCommunicator.prototype.onDiscoverDevice = function(device) {
	//checks if peripheral is in messageList
	for (var i = 0 ; i < messageList.length ; i++) {
		//found device to communicate
		if (messageList[i].deviceMacAddress.toUpperCase() === peripheral.address.toUpperCase()) {
			//changes message status to communicating
			messageList[i].status = "communicating";

			//if it was the last message, stop scanning BLE
			if (!existsMessageWithStatus("pending")) {
				noble.stopScanning();
			}

			//communicates to the device found
			this.communicateToDevice(device, messageList.length -1);
			break;
		}
	}
};

NodeCommunicator.prototype.communicateToDevice = function(device, listIndex) {
	//connects to peripheral
	device.connect(function(error) {
		peripheral.discoverServices(['ffe0'], function(error, services) {
			services[0].discoverCharacteristics(['ffe1'], function(error, characteristics) {
				//gets the characteristic used to communicate
				var theCharacteristic = characteristics[0];

				//sets receiver function
				theCharacteristic.on('read', function(data, isNotification) {
					message = data.toString('utf8');
					this.readFromCharacteristic(theCharacteristic, message, listIndex);
				});

				//sends signal to start communicating
				this.writeToCharacteristic(theCharacteristic, "startingMessage");
			}
		}
	}
};

NodeCommunicator.prototype.writeToCharacteristic = function(theCharacteristic, message) {
	theCharacteristic.write(new Buffer(message, "binary"), true, function(error) {});
};

NodeCommunicator.prototype.readFromCharacteristic = function(theCharacteristic, message, listIndex) {
	console.log("\nMOCK: Received message from node:"\n + message);

	var messageObj = communicatingList[listIndex];

	if (message === "sendNext") {
		//extracts just 20 characters to send (BLE board limit)
		var messageToSend = messageObj.messageString.substr(0,20);
		messageObj.messageString = messageObj.messageString.substr(20);

		this.writeToCharacteristic(theCharacteristic, messageToSend);
	} else if (message === "endOfMessage") {
		//ends the communication of the messageObj and calls its callback
		messageObj.status = "done";
		this.callback(messageObj);

		//resets the NodeCommunicator to initial status
		if (!existsMessageWithStatus("pending") && !existsMessageWithStatus("communicating")) {
			this.messageList = new Array();
			this.isBusy = false;
			this.callback = function() {};
		}
	} else {
		//adds node response to messageObj
		messageObj.responsesPerDevice.push(message);
	}


};

NodeCommunicator.prototype.existsMessageWithStatus = function(status) {
	for (messageObj in messageList) {
		if (messageObj.status === status) {
			return true;
		}
	}
	return false;
};

module.exports = NodeCommunicator;