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

	/*
	var date = Date.now();
	var params = "?linkedSensor=" + JSON.stringify(measurementObj.linkedSensor) + "&value=" + measurementObj.value + "&date=" + date;
	params = encodeURIComponent(params);

	console.log("\n" + this.url + "/addMeasurement" + params);

	unirest.get(this.url + "/addMeasurement" + params)
        .end(function(response) {
        	if (response.ok) {
                        console.log("\nMeasurement sent to the Server.");
                } else {
                        console.log("\n*** Error trying to send measurement to the Server! ***");
                }
	});
	*/

		
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

module.exports = Server;
