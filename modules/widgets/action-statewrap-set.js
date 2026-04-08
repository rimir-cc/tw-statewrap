/*\
title: $:/plugins/rimir/statewrap/modules/widgets/action-statewrap-set.js
type: application/javascript
module-type: widget

Action widget that writes to a named state channel.

Usage:
<$action-statewrap-set channel="selected-project" value=<<currentTiddler>>/>

\*/
(function(){

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var getStatewrapContext = require("$:/plugins/rimir/statewrap/modules/utils.js").getStatewrapContext;

var ActionStatewrapSet = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

ActionStatewrapSet.prototype = new Widget();

ActionStatewrapSet.prototype.render = function(parent, nextSibling) {
	this.computeAttributes();
	this.execute();
};

ActionStatewrapSet.prototype.execute = function() {
	this.channelName = this.getAttribute("channel", "");
	this.channelValue = this.getAttribute("value", "");
	this.noRules = this.getAttribute("no-rules", "no");
};

ActionStatewrapSet.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(Object.keys(changedAttributes).length > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

ActionStatewrapSet.prototype.invokeAction = function(triggeringWidget, event) {
	var ctx = getStatewrapContext(this);
	if(!ctx) {
		return true;
	}

	var channelName = this.channelName;
	var channelDef = ctx.channels[channelName];
	if(!channelDef) {
		console.warn("statewrap: unknown channel '" + channelName + "'");
		return true;
	}

	// Read current value
	var tiddlerPath = channelDef.tiddler;
	var currentTiddler = ctx.wiki.getTiddler(tiddlerPath);
	var currentValue = currentTiddler ? (currentTiddler.fields.text || "") : "";
	var newValue = this.channelValue;

	// Skip if unchanged
	if(currentValue === newValue) {
		return true;
	}

	// Write new value
	ctx.wiki.setText(tiddlerPath, "text", null, newValue);

	// Trigger matching rules unless suppressed or max depth reached
	if(this.noRules !== "yes" && ctx._ruleDepth < 10) {
		ctx._ruleDepth++;
		for(var i = 0; i < ctx.rules.length; i++) {
			var rule = ctx.rules[i];
			if(rule.when === channelName) {
				rule.widget.invokeRuleActions();
			}
		}
		ctx._ruleDepth--;
	}

	return true;
};

exports["action-statewrap-set"] = ActionStatewrapSet;

})();
