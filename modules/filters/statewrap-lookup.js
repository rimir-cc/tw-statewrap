/*\
title: $:/plugins/rimir/statewrap/modules/filters/statewrap-lookup.js
type: application/javascript
module-type: filteroperator

Tree-independent lookup: read the current text of a statewrap channel's state tiddler, with the instid passed explicitly as filter input instead of walked up from the parent widget chain.

Usage: [<instid>statewrap-lookup[channel-name]]

Complements statewrap-get (which requires being inside a <$statewrap> scope). Useful in \function bodies, detached wikitext rendering, and introspection templates where the widget tree can't reach a statewrap context.

\*/
(function(){

"use strict";

exports["statewrap-lookup"] = function(source, operator, options) {
	var channelName = operator.operand || "";
	var results = [];
	if(!channelName) return results;
	source(function(tiddler, title) {
		if(!title) return;
		var stateTitle = "$:/state/rimir/statewrap/" + title + "/" + channelName;
		var t = options.wiki.getTiddler(stateTitle);
		results.push(t ? (t.fields.text || "") : "");
	});
	return results;
};

})();
