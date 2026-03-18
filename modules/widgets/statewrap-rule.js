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
	this.whenChannel = this.getAttribute("when", "");

	// Build child widgets (the action widgets)
	this.makeChildWidgets();

	// Register with parent context
	var ctx = getStatewrapContext(this);
	if(ctx && this.whenChannel) {
		ctx.rules.push({
			when: this.whenChannel,
			widget: this
		});
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
