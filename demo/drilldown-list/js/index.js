'use strict';

/*
This code was modified from Foundation drilldown.
*/

function transitionend($elem) {
	var transitions = {
		'transition': 'transitionend',
		'WebkitTransition': 'webkitTransitionEnd',
		'MozTransition': 'transitionend',
		'OTransition': 'otransitionend'
	};
	var elem = document.createElement('div'),
	    end;

	for (var t in transitions) {
		if (typeof elem.style[t] !== 'undefined') {
			end = transitions[t];
		}
	}
	if (end) {
		return end;
	} else {
		end = setTimeout(function () {
			$elem.triggerHandler('transitionend', [$elem]);
		}, 1);
		return 'transitionend';
	}
}

function Drilldown(element, options) {
	this.$element = $(element);
	this.$list = $(element).find('.drilldown__list');
	this.defaults = {
		el: '[data-drilldown]',
		/**
   * Markup used for JS generated back button. Prepended to submenu lists and deleted on `destroy` method, 'js-drilldown-back' class required. Remove the backslash (`\`) if copy and pasting.
   * @option
   * @example '<\li><\a>Back<\/a><\/li>'
   */
		backButton: '<li class="js-drilldown-back"><a tabindex="0"> <i class="fa fa-angle-left"></i> Back</a></li>',
		/**
   * Markup used to wrap drilldown menu. Use a class name for independent styling; the JS applied class: `is-drilldown` is required. Remove the backslash (`\`) if copy and pasting.
   * @option
   * @example '<\div class="is-drilldown"><\/div>'
   */
		wrapper: '<div></div>',
		/**
   * Adds the parent link to the submenu.
   * @option
   * @example false
   */
		parentLink: false,
		/**
   * Allow the menu to return to root list on body click.
   * @option
   * @example false
   */
		closeOnClick: false
		// holdOpen: false
	};
	this.options = $.extend(this.defaults, options);

	var _this = this;
	console.log('DrillDown', this);
	this.$submenuAnchors = [];
	this.$submenus = [];
	this.$menuItems = [];
	this.$selected = null;

	this.init = function () {

		$(window).on('resize', function (e) {
			console.log('Resize');
			_this._getMaxDims();
		});

		$(element).each(function (i, o) {
			console.log('Found drilldown', i);

			$(o).addClass('is-drilldown').find('[data-submenu]').addClass('is-drilldown-submenu');

			$(o).find('a').parent().addClass('is-drilldown-submenu-parent');
		});
		this.$submenuAnchors = this.$element.find('li.is-drilldown-submenu-parent').children('a');
		this.$submenus = this.$submenuAnchors.parent('li').children('[data-submenu]');
		this.$menuItems = this.$element.find('li').not('.js-drilldown-back').attr('role', 'menuitem').find('a');

		this._prepareMenu();
	};

	/**
  * prepares drilldown menu by setting attributes to links and elements
  * sets a min height to prevent content jumping
  * wraps the element if not already wrapped
  * @private
  * @function
  */
	this._prepareMenu = function () {
		// if(!this.options.holdOpen){
		//   this._menuLinkEvents();
		// }
		this.$submenuAnchors.each(function () {
			var $link = $(this);
			var $sub = $link.parent();
			if (_this.options.parentLink) {
				$link.clone().prependTo($sub.children('[data-submenu]')).wrap('<li class="is-submenu-parent-item is-submenu-item is-drilldown-submenu-item" role="menu-item"></li>');
			}
			$link.data('savedHref', $link.attr('href')).removeAttr('href');
			$sub.attr('data-title', $.trim($link.text()));
			$link.children('[data-submenu]').attr({
				'aria-hidden': true,
				'tabindex': 0,
				'role': 'menu'
			});
			console.log('Attaching sub menu Anchor');
			_this._events($link);
		});
		this.$submenus.each(function () {
			var $menu = $(this),
			    $back = $menu.find('.js-drilldown-back');
			if (!$back.length) {
				$menu.prepend(_this.options.backButton);
			}
			_this._back($menu);
		});
		if (!this.$element.parent().hasClass('is-drilldown')) {
			console.log('Adding is-drilldown to parent');
			this.$wrapper = $(this.options.wrapper).addClass('is-drilldown');
			this.$wrapper = this.$element.wrap(this.$wrapper).parent().css(this._getMaxDims());
		}
	};

	/**
  * Adds event handlers to elements in the menu.
  * @function
  * @private
  * @param {jQuery} $elem - the current menu item to add handlers to.
  */
	this._events = function ($elem) {
		var _this = this;
		$elem.off('click.px.drilldown').on('click.px.drilldown', function (e) {
			_this.$selected = $(e.target);
			console.log('click.px.drilldown');
			if ($(e.target).parentsUntil('ul', 'li').hasClass('is-drilldown-submenu-parent')) {
				e.stopImmediatePropagation();
				e.preventDefault();
			}

			// if(e.target !== e.currentTarget.firstElementChild){
			//   return false;
			// }
			_this._show($elem.parent('li'));

			if (_this.options.closeOnClick) {
				var $body = $('body');
				$body.off('.px.drilldown').on('click.px.drilldown', function (e) {

					if (e.target === _this.$element[0] || $.contains(_this.$element[0], e.target)) {
						return;
					}
					e.preventDefault();
					_this._hideAll();
					$body.off('.px.drilldown');
				});
			}
		});
	};

	/**
  * Closes all open elements, and returns to root menu.
  * @function
  * @fires Drilldown#closed
  */
	this._hideAll = function () {
		var $elem = this.$element.find('.is-drilldown-submenu.is-active').addClass('is-closing');
		$elem.one(transitionend($elem), function (e) {
			$elem.removeClass('is-active is-closing');
		});
		this.$element.trigger('closed.px.drilldown');
	};

	/**
  * Adds event listener for each `back` button, and closes open menus.
  * @function
  * @fires Drilldown#back
  * @param {jQuery} $elem - the current sub-menu to add `back` event.
  */
	this._back = function ($elem) {
		var _this = this;
		$elem.off('click.px.drilldown');
		$elem.children('.js-drilldown-back').on('click.px.drilldown', function (e) {
			e.stopImmediatePropagation();
			console.log('mouseup on back');
			_this._hide($elem);
		});
	};

	/**
  * Adds event listener to menu items w/o submenus to close open menus on click.
  * @function
  * @private
  */
	this._menuLinkEvents = function () {
		var _this = this;
		this.$menuItems.not('.is-drilldown-submenu-parent').off('click.px.drilldown').on('click.px.drilldown', function (e) {
			// e.stopImmediatePropagation();
			setTimeout(function () {
				_this._hideAll();
			}, 0);
		});
	};

	/**
  * Iterates through the nested menus to calculate the min-height, and max-width for the menu.
  * Prevents content jumping.
  * @function
  * @private
  */
	this._getMaxDims = function () {
		var max = 0,
		    result = {};
		this.$submenus.add(this.$element).each(function () {
			var numOfElems = $(this).children('li').length;
			max = numOfElems > max ? numOfElems : max;
		});

		result['min-height'] = max * this.$menuItems[0].getBoundingClientRect().height + 'px';
		result['max-width'] = this.$element[0].getBoundingClientRect().width + 'px';
		console.log('_getMaxDims', result);
		return result;
	};

	/**
  * Opens a submenu.
  * @function
  * @fires Drilldown#open
  * @param {jQuery} $elem - the current element with a submenu to open, i.e. the `li` tag.
  */
	this._show = function ($elem) {
		$elem.children('[data-submenu]').addClass('is-active');
		/**
   * Fires when the submenu has opened.
   * @event Drilldown#open
   */
		_this.$element.trigger('open.px.drilldown', [$elem]);
		console.log('_show', $elem);
	};

	/**
  * Hides a submenu
  * @function
  * @fires Drilldown#hide
  * @param {jQuery} $elem - the current sub-menu to hide, i.e. the `ul` tag.
  */
	this._hide = function ($elem) {
		var _this = this;
		$elem.addClass('is-closing').one(transitionend($elem), function () {
			$elem.removeClass('is-active is-closing');
			$elem.blur();
		});
		/**
   * Fires when the submenu has closed.
   * @event Drilldown#hide
   */
		$elem.trigger('hide.px.drilldown', [$elem]);
	};

	this.init();
}

/**
Usage

*/
$(function () {

	function createItem(name, count) {
		var o = {
			id: name.replace(/\W/g, '-').toLowerCase(),
			label: name,
			children: null,
			href: '#' + name.replace(/\W/g, '-').toLowerCase()
		};
		if (count) {
			o.children = [];
			_.times(count, function (i) {
				o.children.push(createItem('File -' + i));
			});
		}
		return o;
	}

	var tmpl = $('#tmpl').html();
	var compiled = _.template(tmpl);

	var nodes = [createItem('My Documents', 25), createItem('My Movies', 25), createItem('My Music', 15), createItem('My Photos', 25)];

	var templateFn = _.template($('#drilldown__item--tmpl').html());
	var html = compiled({
		'items': nodes,
		templateFn: templateFn
	});

	$('#drilldown').append(html);

	//Logic to show/hide drilldown
	$('.drilldown__context').on('click', function (e) {
		console.log('toggle parent', $(e.currentTarget).parents('.drilldown'));
		$(e.currentTarget).parents('.drilldown').toggleClass('is-open');
	});

	console.log(nodes);

	var dd = new Drilldown('.drilldown__menu');
});