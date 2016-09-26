var unirest = require('unirest');

var Server = function() {
	this.url = "http://verdin.ddns.net";
}

Server.prototype.getLinkedSensors = function(callback) {
	unirest.get(this.url + "/getLinkedSensors")
	.end(function(response) {
		if (response.ok) {
			callback(response.body);
		} else {
			console.log("\n*** Error trying to get linked sensors form the Server! ***");
		}
	});
};

//REVIEW THIS
Server.prototype.addMeasurement = function(measurementObj) {

	console.log("\nMOCK: Sending this measurement to the cloud:\n" + measurementObj);


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