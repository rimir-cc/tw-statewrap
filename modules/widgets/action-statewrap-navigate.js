/*\
title: $:/plugins/rimir/statewrap/modules/widgets/action-statewrap-navigate.js
type: application/javascript
module-type: widget

Action widget that snapshots all channel values onto a navigation history
stack, then sets the specified target channels.

Usage:
<$action-statewrap-navigate label="Dashboard"
    section="jour-fixes" jour-fixe="jf/acme" expanded-meeting="mt/123"/>

- "label" is displayed in the breadcrumb trail.
- Every other attribute whose name matches a declared channel is treated as
  a target value.  Channels not mentioned keep their current value.
- For dynamic channel names (e.g. entity type determined at runtime), use
  "set-channel" and "set-value" attributes as an additional pair.
- The "section" channel (if present) is set first so that cascade rules
  fire before the remaining channels are written.
- The history stack is capped at 10 entries.

\*/
(function(){

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var getStatewrapContext = require("$:/plugins/rimir/statewrap/modules/utils.js").getStatewrapContext;

var MAX_HISTORY = 10;

var ActionStatewrapNavigate = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

ActionStatewrapNavigate.prototype = new Widget();

ActionStatewrapNavigate.prototype.render = function(parent, nextSibling) {
	this.computeAttributes();
	this.execute();
};

ActionStatewrapNavigate.prototype.execute = function() {
	this.makeChildWidgets();
};

ActionStatewrapNavigate.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(Object.keys(changedAttributes).length > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

ActionStatewrapNavigate.prototype.invokeAction = function(triggeringWidget, event) {
	var ctx = getStatewrapContext(this);
	if(!ctx) {
		console.warn("statewrap-navigate: no statewrap context found");
		return true;
	}

	this.computeAttributes();
	var label = this.getAttribute("label", "");

	// Snapshot current channel values
	var snapshot = {};
	var channelNames = Object.keys(ctx.channels);
	for(var i = 0; i < channelNames.length; i++) {
		var chName = channelNames[i];
		var chDef = ctx.channels[chName];
		var tiddler = ctx.wiki.getTiddler(chDef.tiddler);
		snapshot[chName] = tiddler ? (tiddler.fields.text || "") : "";
	}

	// Read existing history stack
	var historyTiddler = ctx.prefix + "_nav-history";
	var stack = [];
	var existingTiddler = ctx.wiki.getTiddler(historyTiddler);
	if(existingTiddler && existingTiddler.fields.text) {
		try { stack = JSON.parse(existingTiddler.fields.text); } catch(e) { stack = []; }
	}

	// Push snapshot
	stack.push({ label: label, channels: snapshot });

	// Cap at MAX_HISTORY
	if(stack.length > MAX_HISTORY) {
		stack = stack.slice(stack.length - MAX_HISTORY);
	}

	// Write history
	ctx.wiki.setText(historyTiddler, "text", null, JSON.stringify(stack));

	// Collect target channel values from attributes
	var targets = {};
	var attrs = this.attributes;
	for(var attr in attrs) {
		if(attr !== "label" && attr !== "set-channel" && attr !== "set-value" && attr !== "$timestamp" && ctx.channels[attr]) {
			targets[attr] = attrs[attr];
		}
	}

	// Support dynamic channel via set-channel / set-value pair
	var dynChannel = this.getAttribute("set-channel", "");
	var dynValue = this.getAttribute("set-value", "");
	if(dynChannel && ctx.channels[dynChannel]) {
		targets[dynChannel] = dynValue;
	}

	// Set channels in declaration order (mirrors appify-channels field order:
	// section → entities → details).  This ensures cascade rules fire at the
	// right tier before later channels are written.
	var channelOrder = Object.keys(ctx.channels);
	for(var co = 0; co < channelOrder.length; co++) {
		var ch = channelOrder[co];
		if(targets[ch] !== undefined) {
			this.setChannel(ctx, ch, targets[ch], false);
		}
	}

	return true;
};

// Set a single channel, optionally suppressing rules
ActionStatewrapNavigate.prototype.setChannel = function(ctx, channelName, value, noRules) {
	var chDef = ctx.channels[channelName];
	if(!chDef) return;

	var tiddlerPath = chDef.tiddler;
	var currentTiddler = ctx.wiki.getTiddler(tiddlerPath);
	var currentValue = currentTiddler ? (currentTiddler.fields.text || "") : "";

	if(currentValue === value) return;

	ctx.wiki.setText(tiddlerPath, "text", null, value);

	if(!noRules && ctx._ruleDepth < 10) {
		ctx._ruleDepth++;
		for(var i = 0; i < ctx.rules.length; i++) {
			var rule = ctx.rules[i];
			if(rule.when === channelName) {
				rule.widget.invokeRuleActions();
			}
		}
		ctx._ruleDepth--;
	}
};

exports["action-statewrap-navigate"] = ActionStatewrapNavigate;

})();
