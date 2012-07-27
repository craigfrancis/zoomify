/*******************************************************************************************
 * zoomify
 * Written by Craig Francis
 * Absolutely minimal version of GSIV to work with touch screens and very slow processors.
********************************************************************************************

/*global window, document, setTimeout, getComputedStyle */
/*jslint white: true */

(function() {

	"use strict";

	//--------------------------------------------------
	// Variables

		var div_ref = null,
			div_half_width = null,
			div_half_height = null,
			img_ref = null,
			img_orig_width = null,
			img_orig_height = null,
			img_zoom_width = null,
			img_zoom_height = null,
			img_start_left = null,
			img_start_top = null,
			img_current_left = null,
			img_current_top = null,
			zoom_control_refs = {},
			zoom_level = 0,
			zoom_levels = [],
			zoom_level_count = [],
			click_last = 0,
			origin = null;

	//--------------------------------------------------
	// Zooming

		function image_zoom(change) {

			//--------------------------------------------------
			// Variables

				var new_zoom,
					new_zoom_width,
					new_zoom_height,
					ratio;

			//--------------------------------------------------
			// Zoom level

				new_zoom = (zoom_level + change);

				if (new_zoom >= zoom_level_count) {
					if (new_zoom > zoom_level_count) {
						div_ref.style.opacity = 0.5;
						setTimeout(function() {div_ref.style.opacity = 1;}, 150);
						return;
					}
					zoom_control_refs['in-on'].style.display = 'none';
					zoom_control_refs['in-off'].style.display = 'block';
				} else {
					zoom_control_refs['in-on'].style.display = 'block';
					zoom_control_refs['in-off'].style.display = 'none';
				}

				if (new_zoom <= 0) {
					if (new_zoom < 0) {
						div_ref.style.opacity = 0.5;
						setTimeout(function() {div_ref.style.opacity = 1;}, 150);
						return;
					}
					zoom_control_refs['out-on'].style.display = 'none';
					zoom_control_refs['out-off'].style.display = 'block';
				} else {
					zoom_control_refs['out-on'].style.display = 'block';
					zoom_control_refs['out-off'].style.display = 'none';
				}

				zoom_level = new_zoom;

			//--------------------------------------------------
			// New width

				img_ref.style.width = zoom_levels[new_zoom] + 'px';

				new_zoom_width = img_ref.width;
				new_zoom_height = img_ref.height;

			//--------------------------------------------------
			// Update position

				if (img_current_left === null) { // Position in the middle on page load

					img_current_left = (div_half_width - (new_zoom_width  / 2));
					img_current_top  = (div_half_height - (new_zoom_height / 2));

				} else {

					ratio = (new_zoom_width / img_zoom_width);

					img_current_left = (div_half_width - ((div_half_width - img_current_left) * ratio));
					img_current_top  = (div_half_height - ((div_half_height - img_current_top)  * ratio));

				}

				img_zoom_width = new_zoom_width;
				img_zoom_height = new_zoom_height;

				img_ref.style.left = img_current_left + 'px';
				img_ref.style.top = img_current_top + 'px';

		}

		function image_zoom_in() {
			image_zoom(1);
		}

		function image_zoom_out() {
			image_zoom(-1);
		}

		function scroll_event(e) {

			//--------------------------------------------------
			// Event

				e = e || window.event;

				var wheelData = (e.detail ? e.detail * -1 : e.wheelDelta / 40);

				image_zoom(wheelData > 0 ? 1 : -1);

			//--------------------------------------------------
			// Prevent default

				if (e.preventDefault) {
					e.preventDefault();
				} else {
					e.returnValue = false;
				}

				return false;

		}

	//--------------------------------------------------
	// Movement

		function event_coords(e) {
			var coords = [];
			if (e.touches && e.touches.length) {
				coords[0] = e.touches[0].clientX;
				coords[1] = e.touches[0].clientY;
			} else {
				coords[0] = e.clientX;
				coords[1] = e.clientY;
			}
			return coords;
		}

		function image_move_update() {

			//--------------------------------------------------
			// Boundary check

				var max_left = (div_half_width - img_zoom_width),
					max_top = (div_half_height - img_zoom_height);

				if (img_current_left > div_half_width)  { img_current_left = div_half_width; }
				if (img_current_top  > div_half_height) { img_current_top  = div_half_height; }
				if (img_current_left < max_left)        { img_current_left = max_left; }
				if (img_current_top  < max_top)         { img_current_top  = max_top;  }

			//--------------------------------------------------
			// Move

				img_ref.style.left = img_current_left + 'px';
				img_ref.style.top  = img_current_top + 'px';

		}

		function image_move_event(e) {

			//--------------------------------------------------
			// Calculations

				e = e || window.event;

				var currentPos = event_coords(e);

				img_current_left = (img_start_left + (currentPos[0] - origin[0]));
				img_current_top = (img_start_top + (currentPos[1] - origin[1]));

				image_move_update();

			//--------------------------------------------------
			// Prevent default

				if (e.preventDefault) {
					e.preventDefault();
				} else {
					e.returnValue = false;
				}

				return false;

		}

		function image_move_start(e) {

			//--------------------------------------------------
			// Event

				e = e || window.event;

				if (e.preventDefault) {
					e.preventDefault();
				} else {
					e.returnValue = false; // IE: http://stackoverflow.com/questions/1000597/
				}

			//--------------------------------------------------
			// Double tap/click event

				var now = new Date().getTime();
				if (click_last > (now - 200)) {
					image_zoom_in();
				} else {
					click_last = now;
				}

			//--------------------------------------------------
			// Add events

					// http://www.quirksmode.org/blog/archives/2010/02/the_touch_actio.html
					// http://www.quirksmode.org/m/tests/drag.html

				if (e.type === 'touchstart') {

					img_ref.onmousedown = null;
					img_ref.ontouchmove = image_move_event;
					img_ref.ontouchend = function() {
						img_ref.ontouchmove = null;
						img_ref.ontouchend = null;
					};

				} else {

					document.onmousemove = image_move_event;
					document.onmouseup = function() {
						document.onmousemove = null;
						document.onmouseup = null;
					};

				}

			//--------------------------------------------------
			// Record starting position

				img_start_left = img_current_left;
				img_start_top = img_current_top;

				origin = event_coords(e);

		}

	//--------------------------------------------------
	// Default styles for JS enabled version

		function css_rule_add(css_rule) {

			var style_element,
				head_ref;

			style_element = document.createElement('style');

			if (style_element.tagName === 'style') { // HTML mode converts tag to upper case

				style_element.setAttribute('type', 'text/css');
				style_element.appendChild(document.createTextNode(css_rule));

				head_ref = document.getElementsByTagName('head');
				if (head_ref[0]) {
					head_ref[0].appendChild(style_element);
				}

			} else {

				document.write('<style type="text\/css"> ' + css_rule + ' <\/style>'); // For older browsers (IE6)

			}

		}

		css_rule_add('#image-zoom-wrapper {overflow: hidden; position: relative;} #image-zoom {visibility: hidden; position: relative;}');

	//--------------------------------------------------
	// On load

		window.onload = function() { // Not DOM ready, as we need the image to have loaded

			div_ref = document.getElementById('image-zoom-wrapper');
			img_ref = document.getElementById('image-zoom');

			if (div_ref && img_ref) {

				//--------------------------------------------------
				// Variables

					var div_border,
						div_style,
						div_width,
						div_height,
						width,
						height,
						button,
						buttons,
						name,
						len,
						k;

				//--------------------------------------------------
				// Wrapper size

					try {
						div_style = getComputedStyle(div_ref, '');
						div_border = div_style.getPropertyValue('border-top-width');
						div_half_width = div_style.getPropertyValue('width');
						div_half_height = div_style.getPropertyValue('height');
					} catch(e) {
						div_border = div_ref.currentStyle.borderWidth;
						div_half_width = div_ref.currentStyle.width;
						div_half_height = div_ref.currentStyle.height;
					}

					div_half_width = Math.round(parseInt(div_half_width, 10) / 2);
					div_half_height = Math.round(parseInt(div_half_height, 10) / 2);

				//--------------------------------------------------
				// Original size

					img_orig_width = img_ref.width;
					img_orig_height = img_ref.height;

				//--------------------------------------------------
				// Add zoom controls

					buttons = [{'t' : 'in', 's' : 'on'}, {'t' : 'in', 's' : 'off'}, {'t' : 'out', 's' : 'on'}, {'t' : 'out', 's' : 'off'}];

					for (k = 0, len = buttons.length; k < len; k = k + 1) {

						button = buttons[k];
						name = button.t + '-' + button.s;

						zoom_control_refs[name] = document.createElement('div');
						zoom_control_refs[name].className = 'zoom-control zoom-' + button.t + ' zoom-' + button.s;

						if (button.t === 'in') {
							if (button.s === 'on') {
								zoom_control_refs[name].onmousedown = image_zoom_in; // onclick on iPhone seems to have a more pronounced delay
							}
						} else {
							if (button.s === 'on') {
								zoom_control_refs[name].onmousedown = image_zoom_out;
							}
						}

						if (button.s === 'on') {
							try {
								zoom_control_refs[name].style.cursor = 'pointer';
							} catch(err) {
								zoom_control_refs[name].style.cursor = 'hand'; // Yes, even IE5 support
							}
						}

						div_ref.appendChild(zoom_control_refs[name]);

					}

				//--------------------------------------------------
				// Zoom levels

					//--------------------------------------------------
					// Defaults

						div_width = (div_half_width * 2);
						div_height = (div_half_height * 2);

						width = img_orig_width;
						height = img_orig_height;

						zoom_levels[zoom_levels.length] = width;

						while (width > div_width || height > div_height) {
							width = (width * 0.75);
							height = (height * 0.75);
							zoom_levels[zoom_levels.length] = Math.round(width);
						}

						zoom_levels.reverse(); // Yep IE5.0 does not support unshift... but I do wonder if a single reverse() is quicker than inserting at the beginning of the array.

					//--------------------------------------------------
					// Mobile phone, over zoom

						if (parseInt(div_border, 10) === 5) { // img width on webkit will return width before CSS is applied
							zoom_levels[zoom_levels.length] = Math.round(img_orig_width * 1.75);
							zoom_levels[zoom_levels.length] = Math.round(img_orig_width * 3);
						}

					//--------------------------------------------------
					// Set default

						zoom_level_count = (zoom_levels.length - 1);

						image_zoom(0);

				//--------------------------------------------------
				// Make visible

					img_ref.style.visibility = 'visible';
					img_ref.style.cursor = 'move';

					div_ref.style.backgroundImage = 'none';

				//--------------------------------------------------
				// Add events

					img_ref.onmousedown = image_move_start;
					img_ref.ontouchstart = image_move_start;

					if (div_ref.addEventListener) {

						div_ref.addEventListener('DOMMouseScroll', scroll_event, false);
						div_ref.addEventListener('mousewheel', scroll_event, false);

					} else if (div_ref.attachEvent) {

						div_ref.attachEvent('onmousewheel', scroll_event);

					}

					document.onkeyup = function(e) {

						var keyCode = (e ? e.which : window.event.keyCode);

						if (keyCode === 37 || keyCode === 39) { // left or right

							img_current_left = (img_current_left + (keyCode === 39 ? 50 : -50));

							image_move_update();

						} else if (keyCode === 38 || keyCode === 40) { // up or down

							img_current_top = (img_current_top + (keyCode === 40 ? 50 : -50));

							image_move_update();

						} else if (keyCode === 107 || keyCode === 187 || keyCode === 61) { // + or = (http://www.javascripter.net/faq/keycodes.htm)

							image_zoom_in();

						} else if (keyCode === 109 || keyCode === 189) { // - or _

							image_zoom_out();

						}

					};

			}

		};

}());
