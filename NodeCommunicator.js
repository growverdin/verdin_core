var noble = require('noble');

//REVIEW THIS
var NodeCommunicator = function(scanTimeout, communicationTimeout) {
	console.log("\nNodeCommunicator Initialized.");

	this.scanTimeout = scanTimeout;
	this.communicationTimeout = communicationTimeout;

	//set initial status for dynamic variables
	this.initialStatus();
	
	noble.on('stateChange', function(state) {
		console.log("\n*** Bluetooth Low Energy has changed to state: " + state + " ***");
	});

	noble.on('discover', this.onDiscoverDevice.bind(this));
};

NodeCommunicator.prototype.initialStatus = function() {
	this.messageList = new Array();
        this.scannedDevices = new Array();
        this.scanTimeoutId = undefined;
        this.communicationTimeoutId = undefined;
        this.isBusy = false;
        this.communicatingCount = 0;
        this.callback = function() {};
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
		this.scanTimeoutId = setTimeout(this.scanTimeouted.bind(this), this.scanTimeout);

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

			//changes message status to scanned and add to scanned list
			this.messageList[i].status = "scanned";
			this.scannedDevices.push({device: device, listIndex: i});
			
			//if it was the last message, stop scanning BLE and connect to nodes
			if (!this.existsMessageWithStatus("pending")) {
				//clear scan timeout
				clearTimeout(this.scanTimeoutId);

				console.log("\nStoped scanning for BLE devices.");

				noble.stopScanning();
				this.communicationTimeoutId = setTimeout(this.communicationTimeouted.bind(this), this.communicationTimeout);
				this.communicateToScannedDevices();
			}

			break;
		}
	}
};

NodeCommunicator.prototype.communicateToScannedDevices = function() {
	//BLE handles max 5 simultaneous connections
	while ((this.communicatingCount < 5) && (this.scannedDevices.length > 0)) {
		this.communicatingCount++;
		var scannedDevice = this.scannedDevices.shift();
		this.communicateToDevice(scannedDevice.device, scannedDevice.listIndex);
	}
};

NodeCommunicator.prototype.communicateToDevice = function(device, listIndex) {
	//connects to peripheral
	device.connect(function(error) {
		if (error) {
			this.messageList[listIndex].status = "error";
		} else {

			console.log("\nConnected to linked device: " + device.address.toUpperCase());

			this.messageList[listIndex].status = "communicating";
			device.discoverServices(['ffe0'], function(error, services) {
				if (error) {
                        		this.messageList[listIndex].status = "error";
                		} else {
					services[0].discoverCharacteristics(['ffe1'], function(error, characteristics) {
						if (error) {
                        				this.messageList[listIndex].status = "error";
                				} else {
							//gets the characteristic used to communicate
							var theCharacteristic = characteristics[0];

							//sets receiver function
							theCharacteristic.on('read', function(data, isNotification) {
								message = data.toString('utf8');
								this.readFromCharacteristic(theCharacteristic, message, listIndex, device);
							}.bind(this));

							//sends signal to start communicating
							this.writeToCharacteristic(theCharacteristic, "startingMessage");
						}
					}.bind(this));
				}
			}.bind(this));
		}
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

			console.log("\nDisconnected from linked device: " + device.address.toUpperCase());

			//ends the communication of the messageObj and calls its callback
			messageObj.status = "done";
                	this.callback(messageObj);
                
                	//if there is no more scanned and communicating devices, resets the NodeCommunicator to initial status
                	if ((this.scannedDevices.length === 0) && (!this.existsMessageWithStatus("communicating"))) {
				//clear communication timeout			
				clearTimeout(this.communicationTimeoutId);
                
                        	console.log("\nNodeCommunicator is has finished communicating and not busy anymore.");
                       
				//set initial status for dynamic variables
        			this.initialStatus(); 
                	} else {
				//communicate with one more device
				this.communicatingCount--;
				this.communicateToScannedDevices();
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

NodeCommunicator.prototype.scanTimeouted = function() {
	console.log("\nStoped scanning for BLE devices. (Timeout)");

	noble.stopScanning();

	//resets the NodeCommunicator to initial status
	if (!this.existsMessageWithStatus("scanned")) {

		console.log("\nNodeCommunicator didn't find any of the linked devices and is returning to initial status.");

		//set initial status for dynamic variables
        	this.initialStatus();
	} else {
		//communicate to scanned devices
		this.communicationTimeoutId = setTimeout(this.communicationTimeouted.bind(this), this.communicationTimeout);
		this.communicateToScannedDevices();
	}
};

NodeCommunicator.prototype.communicationTimeouted = function() {
	console.log("\nCommunication took too long, NodeCoomunicator is returning to initial status. (Timeout)");

	//set initial status for dynamic variables
        this.initialStatus();
};

module.exports = NodeCommunicator;
