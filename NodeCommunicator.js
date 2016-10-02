var noble = require('noble');

//REVIEW THIS
var NodeCommunicator = function() {

	console.log("\nNodeCommunicator Initialized.");

	this.messageList = new Array();
	this.isBusy = false;
	this.callback = function() {};
	
	noble.on('stateChange', function(state) {
		console.log("\n*** Bluetooth Low Energy has changed to state: " + state + " ***");
	});

	noble.on('discover', this.onDiscoverDevice.bind(this));
};

NodeCommunicator.prototype.addMessage = function(messageObj) {
	//adds message with status pending
	messageObj.status = "pending";
	this.messageList.push(messageObj);

	console.log("\nAdded message:\n" + JSON.stringify(messageObj));
};

NodeCommunicator.prototype.communicate = function(callback) {
/*
	ALWAYS REMEMBER: JUST 5 SIMULTANEOUS CONNECTIONS
*/
	if (noble.state === "poweredOn") {

		console.log("\nNodeCommunicator is now communicating and busy.");

		this.isBusy = true;
		this.callback = callback;
		noble.startScanning(['ffe0'], true);

		console.log("\nStarted scanning for BLE devices.");

	} else {
		console.log("\n*** Error trying to communicate! Bluetooth Low Energy is not powered on! ***");
	}
};

NodeCommunicator.prototype.onDiscoverDevice = function(device) {
	//checks if peripheral is in messageList
	for (var i = 0 ; i < this.messageList.length ; i++) {
		//found device to communicate
		if ((this.messageList[i].status === "pending") && (this.messageList[i].deviceMacAddress.toUpperCase() === device.address.toUpperCase())) {

			console.log("\nFound linked device: " + device.address.toUpperCase());

			//changes message status to communicating
			this.messageList[i].status = "communicating";

			//if it was the last message, stop scanning BLE
			if (!this.existsMessageWithStatus("pending")) {

				console.log("\nStoped scanning for BLE devices.");

				noble.stopScanning();
			}

			//communicates to the device found
			this.communicateToDevice(device, i);
			break;
		}
	}
};

NodeCommunicator.prototype.communicateToDevice = function(device, listIndex) {
	//connects to peripheral
	device.connect(function(error) {
		console.log("\nConnected to linked device: " + device.address.toUpperCase());

		//if is there any pending message, restart scanning BLE
		if (this.existsMessageWithStatus("pending")) {

			console.log("\nRestarted scanning for BLE devices.");
			
			noble.startScanning(['ffe0'], true);
		}

		device.discoverServices(['ffe0'], function(error, services) {
			services[0].discoverCharacteristics(['ffe1'], function(error, characteristics) {
				//gets the characteristic used to communicate
				var theCharacteristic = characteristics[0];

				//sets receiver function
				theCharacteristic.on('read', function(data, isNotification) {
					message = data.toString('utf8');
					this.readFromCharacteristic(theCharacteristic, message, listIndex, device);
				}.bind(this));

				//sends signal to start communicating
				this.writeToCharacteristic(theCharacteristic, "startingMessage");
			}.bind(this));
		}.bind(this));
	}.bind(this));
};

NodeCommunicator.prototype.writeToCharacteristic = function(theCharacteristic, message) {

	console.log("\nWrote message to node " + theCharacteristic._peripheralId + ":\n" + message);

	theCharacteristic.write(new Buffer(message, "binary"), true, function(error) {});
};

NodeCommunicator.prototype.readFromCharacteristic = function(theCharacteristic, message, listIndex, device) {
	
	console.log("\nRead message from node " + theCharacteristic._peripheralId + ":\n" + message);

	var messageObj = this.messageList[listIndex];

	if (message === "sendNext") {
		//extracts just 20 characters to send (BLE board limit)
		var messageToSend = messageObj.messageString.substr(0,20);
		messageObj.messageString = messageObj.messageString.substr(20);

		this.writeToCharacteristic(theCharacteristic, messageToSend);
	} else if (message === "endOfMessage") {
		//disconnects from node
		device.disconnect(function(error) {

			//HERE IS THE POINT TO GET MORE CONNECTIONS FROM THE WAITING POOL

			console.log("\nDisconnected from linked device: " + device.address.toUpperCase());

			//ends the communication of the messageObj and calls its callback
			messageObj.status = "done";
                	this.callback(messageObj);
                
                	//resets the NodeCommunicator to initial status
                	if (!this.existsMessageWithStatus("pending") && !this.existsMessageWithStatus("communicating")) {
                
                        	console.log("\nNodeCommunicator is has finished communicating and not busy anymore.");
                        
                        	this.messageList = new Array();
                        	this.isBusy = false;
                        	this.callback = function() {};
                	}
		}.bind(this));
	} else {
		//adds node response to messageObj
		messageObj.responsesPerDevice.push(message);
	}
};

NodeCommunicator.prototype.existsMessageWithStatus = function(status) {
	for (messageObj in this.messageList) {
		if (this.messageList[messageObj].status === status) {
			return true;
		}
	}
	return false;
};

module.exports = NodeCommunicator;
