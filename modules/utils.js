/*\
title: $:/plugins/rimir/statewrap/modules/utils.js
type: application/javascript
module-type: library

Shared utility: walk the widget parent chain to find the nearest statewrapContext.

\*/
(function(){

"use strict";

exports.getStatewrapContext = function(widget) {
	var w = widget;
	while(w) {
		if(w.statewrapContext) {
			return w.statewrapContext;
		}
		w = w.parentWidget;
	}
	return null;
};

})();
