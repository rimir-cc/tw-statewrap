/*\
title: $:/plugins/rimir/statewrap/modules/filters/statewrap-ref.js
type: application/javascript
module-type: filteroperator

Filter operator that returns the state tiddler path for a named channel.

Usage: [statewrap-ref[channel-name]]

\*/
(function(){

"use strict";

function getStatewrapContext(widget) {
	var w = widget;
	while(w) {
		if(w.statewrapContext) {
			return w.statewrapContext;
		}
		w = w.parentWidget;
	}
	return null;
}

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
