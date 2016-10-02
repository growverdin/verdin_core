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

//REVIEW THIS
Server.prototype.addMeasurement = function(measurementObj) {

	console.log("\nMOCK: Sending this measurement to the cloud:\n");
	console.log(measurementObj.linkedSensor.device.macAddress + ": " + measurementObj.value);


	//TRATAR MEASUREMENT PARA JSON
	//measurement = ........
	/*
	unirest.post(this.url + "/addMeasurement")
	.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
	.send(measurement)
	.end(function(response) {
		if (response.ok) {
			console.log("\nMeasurement sent to the Server.");
		} else {
			console.log("\n*** Error trying to send measurement to the Server! ***");
		}
	});
	*/
};

module.exports = Server;
