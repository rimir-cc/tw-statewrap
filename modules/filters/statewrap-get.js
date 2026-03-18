/*\
title: $:/plugins/rimir/statewrap/modules/filters/statewrap-get.js
type: application/javascript
module-type: filteroperator

Filter operator that reads the current value of a named state channel.

Usage: [statewrap-get[channel-name]]

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

exports["statewrap-get"] = function(source, operator, options) {
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
	var tiddler = ctx.wiki.getTiddler(channelDef.tiddler);
	var value = tiddler ? (tiddler.fields.text || "") : "";
	return [value];
};

})();
