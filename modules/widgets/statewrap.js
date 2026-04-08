/*\
title: $:/plugins/rimir/statewrap/modules/widgets/statewrap.js
type: application/javascript
module-type: widget

Container widget that defines named state channels with reactive rules.

Usage:
<$statewrap channels="selected-project selected-task detail-tab"
            default-detail-tab="overview" instid="pm">
  ...children...
</$statewrap>

\*/
(function(){

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var StatewrapWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

StatewrapWidget.prototype = new Widget();

StatewrapWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent, nextSibling);
};

StatewrapWidget.prototype.execute = function() {
	// Parse channel names
	var channelsStr = this.getAttribute("channels", "");
	var channelNames = channelsStr.split(/\s+/).filter(function(name) {
		return name.length > 0;
	});

	// Compute instance prefix
	var instid = this.getAttribute("instid");
	if(!instid) {
		instid = this.getStateQualifier();
	}
	var prefix = "$:/state/rimir/statewrap/" + instid + "/";

	// Build channel definitions
	var channels = {};
	for(var i = 0; i < channelNames.length; i++) {
		var name = channelNames[i];
		var defaultValue = this.getAttribute("default-" + name, "");
		channels[name] = {
			"default": defaultValue,
			tiddler: prefix + name
		};
	}

	// Create context object
	this.statewrapContext = {
		prefix: prefix,
		channels: channels,
		rules: [],
		wiki: this.wiki,
		_ruleDepth: 0
	};

	// Initialize state tiddlers with defaults if they don't exist
	var channelKeys = Object.keys(channels);
	for(var j = 0; j < channelKeys.length; j++) {
		var ch = channels[channelKeys[j]];
		var existing = this.wiki.getTiddler(ch.tiddler);
		if(!existing) {
			this.wiki.setText(ch.tiddler, "text", null, ch["default"]);
		}
	}

	// Build children (rule widgets will self-register during their execute())
	this.makeChildWidgets();
};

StatewrapWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["channels"] || changedAttributes["instid"]) {
		this.refreshSelf();
		return true;
	}
	// Check if any default-* attributes changed
	var keys = Object.keys(changedAttributes);
	for(var i = 0; i < keys.length; i++) {
		if(keys[i].indexOf("default-") === 0) {
			this.refreshSelf();
			return true;
		}
	}
	return this.refreshChildren(changedTiddlers);
};

exports["statewrap"] = StatewrapWidget;

})();
