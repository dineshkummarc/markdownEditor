(function($){
	
/*
 Mathias Bynens proposal to follow changes to a textarea.
 To check what this does, see: http://mathiasbynens.be/notes/oninput
 */
$.fn.input = function(fn) {
  var $this = this;
  if (!fn) {
    return $this.trigger('keydown.input');
  }
  return $this.bind({
    'input.input': function(event) {
      $this.unbind('keydown.input');
      fn.call(this, event);
    },
    'keydown.input': function(event) {
      fn.call(this, event);
    }
  });
};

/*
Markdown Editor by Nacho Coloma.
This work is based on showdown by John Fraser and markdown by John Gruber.
The license is MIT. Use it however you please.

Options:
* resources: JSON object with all the i18n entries
* buttons: a list of buttons to use
* value: The initial value to use
* historyRate: the amount of time (in milliseconds) without user input that triggers a new entry in the history
*/
$.fn.markdownEditor = function(options) {
	
	// container of the whole thing
	var $container,

	// editor
	$editor,

	// preview
	$preview,

	// buttonbar
	$toolbar,

	// history of text modifications (String)
	history = [],

	// current step in history
	hcursor = 0,

	// timestamp of the last history entry
	htimestamp = 0,

	// ShowDown converter
	converter = new Showdown.converter();

	options = $.extend({
		historyRate: 2000,
		buttons: [ 'b', 'i', 'a', 'blockquote', 'pre', 'img', 'h', 'ol', 'ul', 'undo', 'redo', 'help' ],
		resources: {
			'markdown-button-b': 'Bold',
			'markdown-button-i': 'Italic',
			'markdown-button-a': 'Create link',
			'markdown-button-blockquote': 'Quote',
			'markdown-button-pre': 'Code',
			'markdown-button-img': 'Add image',
			'markdown-button-h': 'Header',
			'markdown-button-ol': 'Numbered list',
			'markdown-button-ul': 'Bullet list',
			'markdown-button-undo': 'Undo',
			'markdown-button-redo': 'Redo',
			'markdown-button-help': 'Help'
		}
	}, options);
	$container = $('<div class="markdown-container"><div class="markdown-toolbar"></div><textarea class="markdown-editor"></textarea><div class="markdown-preview"></div></div>');
	$toolbar = $container.find('.markdown-toolbar');
	$editor = $container.find('.markdown-editor');
	$preview = $container.find('.markdown-preview');
	
	/**
	 * Get the selected text
	 * /
	var getSelection = function() {
		var s = document.getSelection || window.getSelection;
		return s? s() : document.selection.createRange().text;
	}*/

	/*
	 * getSelection extracted from fieldSelection jQuery plugin by Alex Brem <alex@0xab.cd>
	 */
	var e = $editor[0];
	var getSelection = 

		/* mozilla / dom 3.0 */
		('selectionStart' in e && function() { 
			var l = e.selectionEnd - e.selectionStart;
			return { 
				start: e.selectionStart, 
				end: e.selectionEnd, 
				length: l, 
				text: e.value.substr(e.selectionStart, l) 
			};
		}) ||

		/* exploder */
		(document.selection && function() {

			e.focus();

			var r = document.selection.createRange();
			if (r === null) {
				return { 
					start: 0, 
					end: e.value.length, 
					length: 0 
				}
			}

			var re = e.createTextRange();
			var rc = re.duplicate();
			re.moveToBookmark(r.getBookmark());
			rc.setEndPoint('EndToStart', re);

			return { 
				start: rc.text.length, 
				end: rc.text.length + 
				r.text.length, 
				length: r.text.length, 
				text: r.text 
			};
		}) ||

		/* browser not supported */
		function() { return null; };


	/*
	 * replaceSelection extracted from fieldSelection jQuery plugin by Alex Brem <alex@0xab.cd>
	 */
	var replaceSelection = 

		/* mozilla / dom 3.0 */
		('selectionStart' in e && function(text) { 
			var start = e.selectionStart;
			e.value = e.value.substr(0, start) + text + e.value.substr(e.selectionEnd, e.value.length);
			e.selectionStart = start;
			e.selectionEnd = start + text.length;
			e.focus();
		}) ||

		/* exploder */
		(document.selection && function(text) {
			e.focus();
			document.selection.createRange().text = text;
		}) ||

		/* browser not supported */
		function(text) {
			e.value += text;
		};

	var pushHistory = function() {
		history[hcursor++] = e.value;
		if (history.length > hcursor) { // if 'undo' and then write something, replace the future entries
			history = history.slice(0, hcursor);
			$toolbar.find('.markdown-button-redo').attr('disabled');
		}
	}

	var popHistory = function() {
		if (hcursor > 0) {
			e.value = history[--hcursor];
			onChange();
		}
	}

	var redoHistory = function() {
		if (hcursor < history.length) {
			e.value = history[hcursor++];
			hcursor == history.length && $toolbar.find('.markdown-button-redo').attr('disabled');
			onChange();
		}
	}

	/**
	 * Update the preview container with fresh user input
	 */
	var onChange = function(event) {
		var html = converter.makeHtml(e.value);
		var newt = $.now();
		if (newt - htimestamp > options.historyRate)
			pushHistory();
		htimestamp = newt;
		$preview.html(html);
	}

	// insert buttons
	$.each(options.buttons, function(index, button) {
		var name = 'markdown-button-' + button;
		$toolbar.append('<a href="#" class="markdown-button ' + name + '" title="' + options.resources[name] + '"><span class="ui-helper-hidden-accessible">' + options.resources[name] + '</span></a>');
	})
	$toolbar
		.on('click', '.markdown-button-b', function() {
			replaceSelection('**' + getSelection().text + '**');
			onChange();
			pushHistory();
		})
		.on('click', '.markdown-button-i', function() {
			replaceSelection('*' + getSelection().text + '*');
			onChange();
			pushHistory();
		})
		.on('click', '.markdown-button-undo', popHistory)
		.on('click', '.markdown-button-redo', redoHistory)
		;

	// this for testing only
	if (options.internals) {
		var i = options.internals;
		i.pushHistory = pushHistory;
		i.popHistory = popHistory;
		i.history = history;
	}

	// insert current value
	options.value && $editor.val(options.value);
	$editor.input(onChange);
	onChange();

	this.html($container);

}

})(jQuery);