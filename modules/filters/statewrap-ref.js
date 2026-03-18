/*\
title: $:/plugins/rimir/statewrap/modules/filters/statewrap-ref.js
type: application/javascript
module-type: filteroperator

Filter operator that returns the state tiddler path for a named channel.

Usage: [statewrap-ref[channel-name]]

\*/
(function(){

"use strict";

var getStatewrapContext = require("$:/plugins/rimir/statewrap/modules/utils.js").getStatewrapContext;

exports["statewrap-ref"] = function(source, operator, options) {
	var channelName = operator.operand || "";
	if(!channelName || !options.widget) {
		return [];
	}
	var ctx = getStatewrapContext(options.widget);
	if(!ctx) {
		return [];
	}
	var channelDef = ctx.channels[channelName];
	if(!channelDef) {
		return [];
	}
	return [channelDef.tiddler];
};

})();
