var unirest = require('unirest');

var Server = function() {

	console.log("\nServer Initialized.");

	this.url = "http://verdin.ddns.net";
};

Server.prototype.getLinkedSensors = function(callback) {
	unirest.get(this.url + "/getLinkedSensors")
	.end(function(response) {
		if (response.ok) {

			console.log("\nGot linked sensors from the Cloud.");

			callback(response.body);
		} else {
			console.log("\n*** Error trying to get linked sensors from the Cloud! ***");
		}
	});
};

Server.prototype.addMeasurement = function(measurementObj) {

	console.log("\nSending this measurement to the cloud: " + measurementObj.linkedSensor.device.macAddress + " " + measurementObj.value);

	unirest.post(this.url + "/addMeasurement")
	.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
	.send(measurementObj)
	.end(function(response) {
		if (response.ok) {
			console.log("\nMeasurement sent to the Server.");
		} else {
			console.log("\n*** Error trying to send measurement to the Server! ***");
		}
	});
};

Server.prototype.getLinkedActuatorsActions = function(callback) {
	unirest.get(this.url + "/getLinkedActuatorsActions")
	.end(function(response) {
		if (response.ok) {

			console.log("\nGot linked actuators actions from the Cloud.");

			callback(response.body);
		} else {
			console.log("\n*** Error trying to get linked actuators actions from the Cloud! ***");
		}
	});
};

Server.prototype.addActuation = function(actuationObj) {

	console.log("\nSending this actuation to the cloud: " + actuationObj.linkedActuator.device.macAddress + " " + actuationObj.value);

	unirest.post(this.url + "/addActuation")
	.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
	.send(actuationObj)
	.end(function(response) {
		if (response.ok) {
			console.log("\nActuation sent to the Server.");
		} else {
			console.log("\n*** Error trying to send actuation to the Server! ***");
		}
	});
};

module.exports = Server;
