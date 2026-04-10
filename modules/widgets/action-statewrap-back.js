/*\
title: $:/plugins/rimir/statewrap/modules/widgets/action-statewrap-back.js
type: application/javascript
module-type: widget

Action widget that pops the navigation history stack and restores all
channel values from the popped snapshot.

Usage:
<$action-statewrap-back/>              — pop the most recent entry
<$action-statewrap-back index="2"/>    — jump to entry at index 2
                                         (removes entries 2..end, restores entry 2)

All channels are restored with rules suppressed to avoid cascade side-effects.

\*/
(function(){

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var getStatewrapContext = require("$:/plugins/rimir/statewrap/modules/utils.js").getStatewrapContext;

var ActionStatewrapBack = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

ActionStatewrapBack.prototype = new Widget();

ActionStatewrapBack.prototype.render = function(parent, nextSibling) {
	this.computeAttributes();
	this.execute();
};

ActionStatewrapBack.prototype.execute = function() {
	this.makeChildWidgets();
};

ActionStatewrapBack.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(Object.keys(changedAttributes).length > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

ActionStatewrapBack.prototype.invokeAction = function(triggeringWidget, event) {
	var ctx = getStatewrapContext(this);
	if(!ctx) {
		console.warn("statewrap-back: no statewrap context found");
		return true;
	}

	this.computeAttributes();

	// Read history stack
	var historyTiddler = ctx.prefix + "_nav-history";
	var existingTiddler = ctx.wiki.getTiddler(historyTiddler);
	if(!existingTiddler || !existingTiddler.fields.text) {
		return true;
	}

	var stack;
	try { stack = JSON.parse(existingTiddler.fields.text); } catch(e) { return true; }
	if(!Array.isArray(stack) || stack.length === 0) {
		return true;
	}

	// Determine which entry to restore
	var indexAttr = this.getAttribute("index", "");
	var entry;
	if(indexAttr !== "") {
		var idx = parseInt(indexAttr, 10);
		if(isNaN(idx) || idx < 0 || idx >= stack.length) {
			return true;
		}
		entry = stack[idx];
		// Remove this entry and everything after it
		stack = stack.slice(0, idx);
	} else {
		// Pop the last entry
		entry = stack.pop();
	}

	// Write updated stack
	ctx.wiki.setText(historyTiddler, "text", null, JSON.stringify(stack));

	// Restore all channels from snapshot without triggering rules
	var channels = entry.channels || {};
	var channelNames = Object.keys(channels);
	for(var i = 0; i < channelNames.length; i++) {
		var chName = channelNames[i];
		var chDef = ctx.channels[chName];
		if(!chDef) continue;

		var tiddlerPath = chDef.tiddler;
		var currentTiddler = ctx.wiki.getTiddler(tiddlerPath);
		var currentValue = currentTiddler ? (currentTiddler.fields.text || "") : "";
		var restoreValue = channels[chName];

		if(currentValue !== restoreValue) {
			ctx.wiki.setText(tiddlerPath, "text", null, restoreValue);
		}
	}

	return true;
};

exports["action-statewrap-back"] = ActionStatewrapBack;

})();
