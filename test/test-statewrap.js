/*\
title: $:/plugins/rimir/statewrap/test/test-statewrap.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for statewrap plugin: container widget, rule widget, action widget, filter operators.

\*/
"use strict";

describe("statewrap", function() {

	function setupWiki(tiddlers) {
		var wiki = new $tw.Wiki();
		wiki.addTiddlers(tiddlers || []);
		wiki.addIndexersToWiki();
		return wiki;
	}

	function renderWidget(wiki, text) {
		var widgetNode = wiki.makeTranscludeWidget(null, {
			document: $tw.fakeDocument,
			parseAsInline: false,
			variables: {}
		});
		var container = $tw.fakeDocument.createElement("div");
		// Parse and render the wikitext
		var parser = wiki.parseText("text/vnd.tiddlywiki", text, { parseAsInline: false });
		var widgetTree = wiki.makeWidget(parser, {
			document: $tw.fakeDocument,
			parentWidget: widgetNode
		});
		widgetTree.render(container, null);
		return { container: container, widget: widgetTree, wiki: wiki };
	}

	describe("container widget (<$statewrap>)", function() {

		it("should initialize state tiddlers with defaults", function() {
			var wiki = setupWiki([]);
			renderWidget(wiki, '<$statewrap channels="tab view" default-tab="home" instid="test1"></$statewrap>');

			var tabTiddler = wiki.getTiddler("$:/state/rimir/statewrap/test1/tab");
			var viewTiddler = wiki.getTiddler("$:/state/rimir/statewrap/test1/view");
			expect(tabTiddler).toBeDefined();
			expect(tabTiddler.fields.text).toBe("home");
			expect(viewTiddler).toBeDefined();
			expect(viewTiddler.fields.text).toBe("");
		});

		it("should not overwrite existing state tiddlers", function() {
			var wiki = setupWiki([
				{ title: "$:/state/rimir/statewrap/test2/tab", text: "settings" }
			]);
			renderWidget(wiki, '<$statewrap channels="tab" default-tab="home" instid="test2"></$statewrap>');

			var tabTiddler = wiki.getTiddler("$:/state/rimir/statewrap/test2/tab");
			expect(tabTiddler.fields.text).toBe("settings");
		});

		it("should handle empty channels attribute", function() {
			var wiki = setupWiki([]);
			expect(function() {
				renderWidget(wiki, '<$statewrap channels="" instid="test3"></$statewrap>');
			}).not.toThrow();
		});

		it("should default empty channels to empty string", function() {
			var wiki = setupWiki([]);
			renderWidget(wiki, '<$statewrap channels="x" instid="test4"></$statewrap>');

			var tiddler = wiki.getTiddler("$:/state/rimir/statewrap/test4/x");
			expect(tiddler).toBeDefined();
			expect(tiddler.fields.text).toBe("");
		});
	});

	describe("action widget (<$action-statewrap-set>)", function() {

		it("should write value to the correct state tiddler", function() {
			var wiki = setupWiki([]);
			var text = '<$statewrap channels="selected" instid="act1">' +
				'<$button><$action-statewrap-set channel="selected" value="hello"/></$button>' +
				'</$statewrap>';
			var result = renderWidget(wiki, text);

			// Find and invoke the button
			var button = findWidget(result.widget, "button");
			expect(button).toBeDefined();
			button.invokeActions(button, {});

			var tiddler = wiki.getTiddler("$:/state/rimir/statewrap/act1/selected");
			expect(tiddler.fields.text).toBe("hello");
		});

		it("should skip write when value unchanged", function() {
			var wiki = setupWiki([
				{ title: "$:/state/rimir/statewrap/act2/ch", text: "same" }
			]);
			var text = '<$statewrap channels="ch" instid="act2">' +
				'<$button><$action-statewrap-set channel="ch" value="same"/></$button>' +
				'</$statewrap>';
			var result = renderWidget(wiki, text);

			var button = findWidget(result.widget, "button");
			button.invokeActions(button, {});

			// Value should remain unchanged (no error, no-op)
			expect(wiki.getTiddler("$:/state/rimir/statewrap/act2/ch").fields.text).toBe("same");
		});

		it("should default value to empty string", function() {
			var wiki = setupWiki([
				{ title: "$:/state/rimir/statewrap/act3/ch", text: "notempty" }
			]);
			var text = '<$statewrap channels="ch" instid="act3">' +
				'<$button><$action-statewrap-set channel="ch"/></$button>' +
				'</$statewrap>';
			var result = renderWidget(wiki, text);

			var button = findWidget(result.widget, "button");
			button.invokeActions(button, {});

			expect(wiki.getTiddler("$:/state/rimir/statewrap/act3/ch").fields.text).toBe("");
		});
	});

	describe("reactive rules (<$statewrap-rule>)", function() {

		it("should fire rule actions when channel changes", function() {
			var wiki = setupWiki([]);
			var text = '<$statewrap channels="project task" instid="rule1">' +
				'<$statewrap-rule when="project">' +
				'<$action-statewrap-set channel="task" value=""/>' +
				'</$statewrap-rule>' +
				'<$button><$action-statewrap-set channel="project" value="Alpha"/></$button>' +
				'</$statewrap>';
			var result = renderWidget(wiki, text);

			// Set task to something first
			wiki.setText("$:/state/rimir/statewrap/rule1/task", "text", null, "existing-task");

			// Click button to change project → should trigger rule to clear task
			var button = findWidget(result.widget, "button");
			button.invokeActions(button, {});

			expect(wiki.getTiddler("$:/state/rimir/statewrap/rule1/project").fields.text).toBe("Alpha");
			expect(wiki.getTiddler("$:/state/rimir/statewrap/rule1/task").fields.text).toBe("");
		});

		it("should not fire rules when no-rules is yes", function() {
			var wiki = setupWiki([]);
			var text = '<$statewrap channels="project task" instid="rule2">' +
				'<$statewrap-rule when="project">' +
				'<$action-statewrap-set channel="task" value="cleared"/>' +
				'</$statewrap-rule>' +
				'<$button><$action-statewrap-set channel="project" value="Beta" no-rules="yes"/></$button>' +
				'</$statewrap>';
			var result = renderWidget(wiki, text);

			wiki.setText("$:/state/rimir/statewrap/rule2/task", "text", null, "keep-this");

			var button = findWidget(result.widget, "button");
			button.invokeActions(button, {});

			expect(wiki.getTiddler("$:/state/rimir/statewrap/rule2/project").fields.text).toBe("Beta");
			expect(wiki.getTiddler("$:/state/rimir/statewrap/rule2/task").fields.text).toBe("keep-this");
		});

		it("should cascade rules transitively", function() {
			var wiki = setupWiki([]);
			// Rule A: when project changes → set task
			// Rule B: when task changes → set detail
			// Changing project should trigger rule A, whose write should in turn trigger rule B
			var text = '<$statewrap channels="project task detail" instid="rule3">' +
				'<$statewrap-rule when="project">' +
				'<$action-statewrap-set channel="task" value="auto-task"/>' +
				'</$statewrap-rule>' +
				'<$statewrap-rule when="task">' +
				'<$action-statewrap-set channel="detail" value="auto-detail"/>' +
				'</$statewrap-rule>' +
				'<$button><$action-statewrap-set channel="project" value="X"/></$button>' +
				'</$statewrap>';
			var result = renderWidget(wiki, text);

			var button = findWidget(result.widget, "button");
			button.invokeActions(button, {});

			expect(wiki.getTiddler("$:/state/rimir/statewrap/rule3/project").fields.text).toBe("X");
			expect(wiki.getTiddler("$:/state/rimir/statewrap/rule3/task").fields.text).toBe("auto-task");
			expect(wiki.getTiddler("$:/state/rimir/statewrap/rule3/detail").fields.text).toBe("auto-detail");
		});
	});

	describe("filter operators", function() {

		it("statewrap-get should return channel value", function() {
			var wiki = setupWiki([]);
			var text = '<$statewrap channels="ch" instid="filt1" default-ch="hello">' +
				'<$text text={{{[statewrap-get[ch]]}}}/>' +
				'</$statewrap>';
			var result = renderWidget(wiki, text);

			var textContent = result.container.textContent || "";
			expect(textContent).toContain("hello");
		});

		it("statewrap-ref should return state tiddler path", function() {
			var wiki = setupWiki([]);
			var text = '<$statewrap channels="ch" instid="filt2">' +
				'<$text text={{{[statewrap-ref[ch]]}}}/>' +
				'</$statewrap>';
			var result = renderWidget(wiki, text);

			var textContent = result.container.textContent || "";
			expect(textContent).toContain("$:/state/rimir/statewrap/filt2/ch");
		});

		it("statewrap-get should return empty for unknown channel", function() {
			var wiki = setupWiki([]);
			var text = '<$statewrap channels="ch" instid="filt3">' +
				'<$text text={{{[statewrap-get[nonexistent]]}}}/>' +
				'</$statewrap>';
			var result = renderWidget(wiki, text);

			// Should produce empty output for unknown channel
			var textContent = result.container.textContent || "";
			expect(textContent).not.toContain("$:/state");
		});
	});

	// Helper: recursively find a widget by type in the widget tree
	function findWidget(widget, typeName) {
		if(widget.parseTreeNode && widget.parseTreeNode.type === typeName) {
			return widget;
		}
		if(widget.children) {
			for(var i = 0; i < widget.children.length; i++) {
				var found = findWidget(widget.children[i], typeName);
				if(found) return found;
			}
		}
		return null;
	}
});
