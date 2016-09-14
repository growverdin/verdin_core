var unirest = require('unirest');

function Server() {
	this.url = "http://verdin.ddns.net";
}

Server.prototype.getLinkedSensors = function(callback) {
	unirest.get(this.url + "/getLinkedSensors")
	.end(function(response) {
		if (response.ok) {
			callback(JSON.parse(response.body));
		} else {
			console.log("\n*** Error trying to get linked sensors form the Server! ***");
		}
	});
};

//REVIEW THIS
Server.prototype.addMeasurement = function(measurement) {

	//TRATAR MEASUREMENT PARA JSON
	//measurement = ........

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
};

module.exports = Server;