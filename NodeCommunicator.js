var noble = require('noble');

//REVIEW THIS
function NodeCommunicator() {
	this.messageList = new Array();
}

//REVIEW THIS
NodeCommunicator.prototype.addMessage = function(message) {
	this.messageList.push(message);
};

//REVIEW THIS
NodeCommunicator.prototype.communicate = function(callback) {
	//noble scan blablabla.......

	//for each response
	callback(response);
}

module.exports = NodeCommunicator;