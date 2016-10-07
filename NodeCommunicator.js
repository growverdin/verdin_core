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
	//if still has any device connected
	if (this.communicatingDevices && this.communicatingDevices.length > 0) {
		var devicesToRemove = this.communicatingDevices.slice();

		for (var i in devicesToRemove) {
			this.messageList[devicesToRemove[i].listIndex].status = "timeout";
			var popedDevice = this.popFromCommunicatingDevices(devicesToRemove[i]);

			if (popedDevice.device.state === "connected") {
				popedDevice.device.disconnect(function(error) {

					console.log("\nDisconnected from linked device: " + popedDevice.device.address.toUpperCase());

					//if there is no more devices connected
					if (this.communicatingDevices.length === 0) {
						this.messageList = new Array();
						this.scannedDevices = new Array();
						this.communicatingDevices = new Array();
						this.scanTimeoutId = undefined;
						this.communicationTimeoutId = undefined;
						this.isBusy = false;
						this.callback = function() {};

						console.log("NodeCommunicator returned to initial status.");
					}
				}.bind(this));
			} else {
				//if there is no more devices connected
				if (this.communicatingDevices.length === 0) {
					this.messageList = new Array();
					this.scannedDevices = new Array();
					this.communicatingDevices = new Array();
					this.scanTimeoutId = undefined;
					this.communicationTimeoutId = undefined;
					this.isBusy = false;
					this.callback = function() {};
			    
					console.log("NodeCommunicator returned to initial status.");
				}			
			}
		}
	} else {
		this.messageList = new Array();
		this.scannedDevices = new Array();
		this.communicatingDevices = new Array();
		this.scanTimeoutId = undefined;
		this.communicationTimeoutId = undefined;
		this.isBusy = false;
		this.callback = function() {};

		console.log("NodeCommunicator returned to initial status.");
	}

	//clear all listeners for not calling any lost callback
	for (var uuid in noble._peripherals) {
		noble._peripherals[uuid].removeAllListeners('servicesDiscover');
	
		for (var uuidS in noble._peripherals[uuid].services) {
			noble._peripherals[uuid].services[uuidS].removeAllListeners('characteristicsDiscover');

			for (var uuidC in noble._peripherals[uuid].services[uuidS].characteristics) {
				noble._peripherals[uuid].services[uuidS].characteristics[uuidC].removeAllListeners('read');
				noble._peripherals[uuid].services[uuidS].characteristics[uuidC].removeAllListeners('write');
			}
		}
	}
};

NodeCommunicator.prototype.addMessage = function(messageObj) {
	//adds message with status pending
	messageObj.status = "pending";
	this.messageList.push(messageObj);

	//console.log("\nAdded message:\n" + JSON.stringify(messageObj));
};

NodeCommunicator.prototype.communicate = function(callback) {
/*
	ALWAYS REMEMBER: JUST 5 SIMULTANEOUS CONNECTIONS
*/
	if (noble.state === "poweredOn") {
		console.log("\nNodeCommunicator is now communicating and busy.");

		this.isBusy = true;
		this.callback = callback;
		this.scanTimeoutId = setTimeout(this.scanTimeouted.bind(this), this.scanTimeout);
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
	while ((this.communicatingDevices.length < 5) && (this.scannedDevices.length > 0)) {
		var currentDevice = this.scannedDevices.shift();
		this.messageList[currentDevice.listIndex].status = "communicating";
		this.communicatingDevices.push(currentDevice);
		this.communicateToDevice(currentDevice);
	}
};

NodeCommunicator.prototype.communicateToDevice = function(currentDevice) {
	//connects to peripheral
	currentDevice.device.connect(function(error) {
		if (error) {
			console.log("\nError trying to connect to device: " + currentDevice.device.address.toUpperCase());

			this.popFromCommunicatingDevices(currentDevice);
			this.messageList[currentDevice.listIndex].status = "error";

			this.communicateToScannedDevices();
		} else {

			console.log("\nConnected to linked device: " + currentDevice.device.address.toUpperCase());

			currentDevice.device.discoverServices(['ffe0'], function(error, services) {
				if (error) {
					console.log("\nError trying to discover services of device: " + currentDevice.device.address.toUpperCase());

					currentDevice.device.disconnect(function(error) {
						if (error) {
							console.log("\nError trying to disconnected from linked device: " + currentDevice.device.address.toUpperCase());
						} else {
							console.log("\nDisconnected from linked device: " + currentDevice.device.address.toUpperCase());

							this.messageList[currentDevice.listIndex].status = "error";
							this.popFromCommunicatingDevices(currentDevice);

							this.communicateToScannedDevices();
						}
					}.bind(this));
        			} else {

					console.log("\nService of linked device: ".underline.red + currentDevice.device.address.toUpperCase());

					services[0].discoverCharacteristics(['ffe1'], function(error, characteristics) {
						if (error) {
							console.log("\nError trying to discover characteristics of device: " + currentDevice.device.address.toUpperCase());

							currentDevice.device.disconnect(function(error) {
								if (error) {
                                                        		console.log("\nError trying to disconnected from linked device: " + currentDevice.device.address.toUpperCase());
                                                		} else {
									console.log("\nDisconnected from linked device: " + currentDevice.device.address.toUpperCase());
								
									this.messageList[currentDevice.listIndex].status = "error";
                                                        		this.popFromCommunicatingDevices(currentDevice);
								
									this.communicateToScannedDevices();
								}
							}.bind(this));
        					} else {

							console.log("\nCharacteristic of linked device: " + currentDevice.device.address.toUpperCase());

							//gets the characteristic used to communicate
							var theCharacteristic = characteristics[0];

							//sets receiver function
							theCharacteristic.on('read', function(data, isNotification) {
								message = data.toString('utf8');
								this.readFromCharacteristic(theCharacteristic, message, currentDevice);
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

	console.log("\nWrote message to node " + theCharacteristic._peripheralId + ": " + message);

	theCharacteristic.write(new Buffer(message, "binary"), true, function(error) {});
};

NodeCommunicator.prototype.readFromCharacteristic = function(theCharacteristic, message, currentDevice) {
	
	console.log("\nRead message from node " + theCharacteristic._peripheralId + ": " + message);

	var messageObj = this.messageList[currentDevice.listIndex];

	if (message === "sendNext") {
		//extracts just 20 characters to send (BLE board limit)
		var messageToSend = messageObj.messageString.substr(0,20);
		messageObj.messageString = messageObj.messageString.substr(20);

		this.writeToCharacteristic(theCharacteristic, messageToSend);
	} else if (message === "endOfMessage") {
		currentDevice.device.disconnect(function(error) {
			if (error) {
				console.log("\nError trying to disconnected from linked device: " + currentDevice.device.address.toUpperCase());
			} else {
				console.log("\nDisconnected from linked device: " + currentDevice.device.address.toUpperCase());

				this.popFromCommunicatingDevices(currentDevice);
			}

			messageObj.status = "done";
			this.callback(messageObj);

			//if there is no more scanned and communicating devices, resets the NodeCommunicator to initial status
			if ((this.scannedDevices.length === 0) && (this.communicatingDevices.length === 0)) {
				//clear communication timeout			
				clearTimeout(this.communicationTimeoutId);
		
				console.log("\nNodeCommunicator has finished communicating.");
		       
				//set initial status for dynamic variables
				this.initialStatus(); 
			} else {
				//communicate with one more device
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

NodeCommunicator.prototype.popFromCommunicatingDevices = function(currentDevice) {
	var popedDevice = undefined;

	for (var i in this.communicatingDevices) {
		if (this.communicatingDevices[i].device.address === currentDevice.device.address) {
			popedDevice = this.communicatingDevices.splice(i, 1)[0];
			break;
		}
	}

	return popedDevice;
}

NodeCommunicator.prototype.scanTimeouted = function() {
	noble.stopScanning();

	console.log("\nStoped scanning for BLE devices. (Timeout)");

	//if there is no scanned devices, resets the NodeCommunicator to initial status
	if (this.scannedDevices.length === 0) {
		console.log("\nNodeCommunicator didn't find any of the linked devices.");

		//set initial status for dynamic variables
        	this.initialStatus();
	} else {
		//communicate to scanned devices
		this.communicationTimeoutId = setTimeout(this.communicationTimeouted.bind(this), this.communicationTimeout);
		this.communicateToScannedDevices();
	}
};

NodeCommunicator.prototype.communicationTimeouted = function() {
	console.log("\nCommunication took too long. (Timeout)".underline.blue);

	//set initial status for dynamic variables
	this.initialStatus();
};

module.exports = NodeCommunicator;
