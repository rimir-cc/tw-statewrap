/*\
title: $:/plugins/rimir/statewrap/modules/widgets/statewrap-rule.js
type: application/javascript
module-type: widget

Reactive rule widget that declares wikitext actions for a channel change.

Usage:
<$statewrap-rule when="selected-project">
  <$action-statewrap-set channel="selected-task" value=""/>
</$statewrap-rule>

\*/
(function(){

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var getStatewrapContext = require("$:/plugins/rimir/statewrap/modules/utils.js").getStatewrapContext;

var StatewrapRuleWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

StatewrapRuleWidget.prototype = new Widget();

StatewrapRuleWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	// Non-rendering widget — no DOM output, but still build child widgets
	// so action widgets are available for invokeActions
};

StatewrapRuleWidget.prototype.execute = function() {
	var whenAttr = this.getAttribute("when", "");
	this.whenChannels = whenAttr.split(/\s+/).filter(function(name) {
		return name.length > 0;
	});

	// Build child widgets (the action widgets)
	this.makeChildWidgets();

	// Register with parent context — one entry per channel
	var ctx = getStatewrapContext(this);
	if(ctx) {
		for(var i = 0; i < this.whenChannels.length; i++) {
			ctx.rules.push({
				when: this.whenChannels[i],
				widget: this
			});
		}
	}
};

StatewrapRuleWidget.prototype.invokeRuleActions = function() {
	this.invokeActions(this, {});
};

StatewrapRuleWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["when"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports["statewrap-rule"] = StatewrapRuleWidget;

})();
