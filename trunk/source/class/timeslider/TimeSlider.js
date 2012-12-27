/**
 * A widget that can be used to choose a certain timeFrame from a
 * larger timeFrame.
 */

qx.Class.define('timeslider.TimeSlider', {

    extend: qx.ui.core.Widget,

    statics: {

		/**
         * The area around the selectors left an right edge, 
         * that can be used to resize.
         */

		SELECTOR_RESIZE_BORDER: 15
	},

	construct: function() {
		this.base(arguments);
		var l = new qx.ui.layout.Canvas();
		this._setLayout(l);
		this.setHeight(45);

		this.__background = this._createChildControl("background");
		this._createChildControl("time-selector");
		this._createChildControl("time-selector-feedback");
		this._excludeChildControl("time-selector-feedback");

		/* Refresh the children on widget resize */
		this.addListener('resize', this._onResize, this);

		var selector = this.getChildControl('time-selector');

		// Target for draggin is this complete widget.
		this.addListener('mousedown', this.__onMousedown, this);
		this.addListener('mousemove', this.__onMousemove, this);
		this.addListener('mouseup', this.__onMouseup, this);
		this.addListener('mouseout', this.__onMouseout, this);
	},

	members: {

		/**
         * The widget used to render the background.
         */

		__background: null,

		/**
         * Size of a month in pixel.
         */

		__sizeMonth: 0,

		/**
         * The amount of displayed months.
         */

		__months: 0,

		__normalizedStartDate: null,
		__normalizedEndDate: null,

		/**
         * The smallest possible timeFrame
         */

		__normalizedStart: null,

		/**
         * Selector
         */

		__selectorPosX: 0,
		__selectorWidth: 0,

		/**
         * Creates all used child widgets.
         */

		_createChildControlImpl: function(id) {
			var control;

			switch (id) {
			case 'time-selector':
				control = new qx.ui.basic.Atom();
				control.setBackgroundColor(qx.theme.manager.Color.getInstance().resolve('timeslider-selection'));
				control.set({
					allowStretchX: false,
					opacity: 0.5,
					zIndex: 2
				});
				this._add(control, {
					top: 0,
					left: 0,
					bottom: 0
				});
				break;

			case 'time-selector-feedback':
				control = new qx.ui.basic.Atom();
				control.setBackgroundColor(qx.theme.manager.Color.getInstance().resolve('timeslider-selection'));
				control.setUserBounds(0, 0, 0, 0);
				control.set({
					allowStretchX: false,
					opacity: 0.3,
					zIndex: 1000
				});
				this._add(control);
				break;

			case 'background':
				control = new qx.ui.embed.Html();
				control.set({
					zIndex: 1,
					selectable: false
				});
				this._add(control, {
					top: 0,
					left: 0,
					right: 0,
					bottom: 0
				});
				break;
			}

			return control || this.base(arguments, id);
		},

		/**
         * Handle resizing of this element.
         */

		_onResize: function(e) {
			var bounds = e.getData();
			if (this.getTimeFrame()) {
				this._renderBackground(this.getTimeFrame(), bounds.width, bounds.height);
				if (this.getTimeSelection()) {
					this._positionSelector(this.getTimeSelection(), bounds.width);
				}
			}
			this.__refreshRasterSize(this.getRasterSize(), bounds.width);
		},

		/**
         * Updates the position of the selector using the current timeSelection.
         *
         * @param timeSelection {timeslider.TimeFrame} The timeFrame that
         *                      will be used to calculate the position of the
         *                      selection.
         *
         * @param width {Integer} The width of this widget, that will be used
         *                      to calculate the childrens sizes.
         */

		_positionSelector: function(ts, width) {
			/* selection start */
			var ss = ts.getStart().getTime();
			/* selection end */
			var se = ts.getEnd().getTime();

			/* frame start */
			var fs = this.__normalizedStartDate.getTime();
			/* frame end */
			var fe = this.__normalizedEndDate.getTime();

			/* Calculate the starting position */
			var selStartPx = Math.floor(width * ((ss - fs) / (fe - fs)));

			/* Calculate the width of the selection */
			var selWidth = Math.floor(width * ((se - ss) / (fe - fs)));

			this.__updateSel(selStartPx, selWidth);
		},

		__updateSel: function(x, width) {
			this.__selectorPosX = x;
			this.__selectorWidth = width;

			this.getChildControl('time-selector').
			set({
				width: width
			}).
			setLayoutProperties({
				top: 0,
				left: x,
				bottom: 0
			});
		},

		__updateSelFeedback: function(x, width) {
			this._showChildControl('time-selector-feedback');
			this.getChildControl('time-selector-feedback').setUserBounds(x, 0, width, this.getHeight());
		},

		/**
         * Update the timeSelection using the current selector position.
         *
         * @param {Integer} x       The current position of the selector, relative to the
         *                          slider start.
         * @param {Integer} width   The current width.
         */

		_updateTimeSelFromPx: function(x, width) {

			/* time frame of the slider */
			var fs = this.__normalizedStartDate.getTime();
			var fe = this.__normalizedEndDate.getTime();
			var msFrame = fe - fs;
			var pxFrame = this.getBounds().width;

			/* Create the start Date */
			var start = new Date(fs + ((x / pxFrame) * msFrame));

			/* Create the end Date */
			var end = new Date(fs + (((x + width) / pxFrame) * msFrame));

			var ts = new timeslider.TimeFrame(start, end);
			this.setTimeSelection(ts);
		},

		/**
         * Create the html of the qx.ui.embed.Html that is used 
         * to display the background.
         *
         * @param width {Integer} The width of this widget, that will be used
         *                      to calculate the childrens sizes.
         */

		_renderBackground: function(timeFrame, width, height) {
			this.__months = 0;

			if (!timeFrame) {
				return;
			}

			/**
             * Create the html for the background
             */

			/* fetch the used months */
			var s = timeFrame.getStart();
			var e = timeFrame.getEnd();

			var cutil = qx.util.ColorUtil;
			var borderCol = qx.theme.manager.Color.getInstance().resolve('timeslider-month-border');

			var html = '<table border=1 rules=all width=' + width + ' height=' + height + ' bordercolor="' + borderCol + '"; style="border-collapse:collapse; table-layout:fixed;">';
			var months = qx.locale.Date.getMonthNames('abbreviated');

			/**
             * Create a table element for every month in the timeFrame
             * sy := start year
             * ey :=  end year
             * sm := start month
             * em := end month
             * m := current month
             * j := current year
             */
			var sy = s.getYear(),
			sm = s.getMonth(),
			ey = e.getYear(),
			em = e.getMonth();
			for (var m = sm, y = sy; y < ey || m <= em; m++) {
				html += '<th>' + months[m] + '</th>';
				this.__months++;
				if (m === 11) {
					/* start a new year */
					m = - 1;
					y++;
				}
			}
			this.getChildControl('background').setHtml(html);
			this.__sizeMonth = width / this.__months;
		},

		__applyTimeFrame: function(timeFrame) {
			if (!timeFrame) {
				return;
			}

			// Calculate normalized Dates
			var s = timeFrame.getStart();
			this.__normalizedStartDate = new Date(s.getFullYear(), s.getMonth(), 1, 0, 0, 0);

			// Go to the first second that isn't part of the timeFrame
			var e = timeFrame.getEnd();
			this.__normalizedEndDate = new Date(e.getFullYear(), e.getMonth() + 1, 1, 0, 0, 0);

			var bounds = this.getBounds();
			if (!bounds) {
				return;
			}
			this._renderBackground(timeFrame, bounds.width, bounds.height);

			if (this.getTimeSelection()) {
				this._positionSelector(this.getTimeSelection(), bounds.width);
			}
		},

		__applyTimeSelection: function(selection) {
			if (!selection || ! this.getTimeFrame()) {
				return;
			}
			var bounds = this.getBounds();
			if (!bounds) {
				return;
			}
			qx.log.Logger.debug("New time selection: " + selection.toString());
			this._positionSelector(selection, bounds.width);
		},

		/**
         * Display the marks.
         */

		_applyMarks: function(marks) {
			throw new Error("__applyMarks is not implemented!");
		},

		__applyRasterSize: function(raster) {
			var bounds = this.getBounds();

			if (bounds) {
				var width = bounds.width;
				this.__refreshRasterSize(raster, width);
			}
		},

		__refreshRasterSize: function(raster, width) {
			this.__rasterPx = raster === 0 ? 1: width * (raster / (this.__normalizedEndDate.getTime() - this.__normalizedStartDate.getTime()));
		},


		/* ********************************************************************
                                    DRAG AND DROP
           ******************************************************************* */

		__moving: false,
		__resizingStart: false,
		__resizingEnd: false,

		/* the space between the select border and the mouse on first move click */
		__diffLeft: 0,
		__diffRight: 0,

		/* the size of the raster in px */
		__rasterPx: 1,

		__onMousemove: function(e) {
			////qx.log.Logger.debug('mousemove');
			if (this.__moving) {
				////qx.log.Logger.debug('currently moving');
				// Update the drag feedback
				var mouseX = e.getDocumentLeft();
				this._move(mouseX, false);
			}
			else if (this.__resizingStart) {
				//qx.log.Logger.debug('currently resizing the start');
				// Update the drag feedback
				mouseX = e.getDocumentLeft();
				this.__resizeStart(mouseX, false);
			}

			else if (this.__resizingEnd) {
				//qx.log.Logger.debug('currently resizing the end');
				// Update the drag feedback
				mouseX = e.getDocumentLeft();
				this.__resizeEnd(mouseX, false);
			}
			else {
				var mode = this.__getMouseMode(e.getDocumentLeft());
				var cursor = mode === 2 ? 'default': mode !== 0 ? 'ew-resize': 'pointer';
				//qx.log.Logger.debug('changing the cursor to ' + cursor);
				this.getApplicationRoot().setGlobalCursor(cursor);
				return;
			}
			this.getApplicationRoot().setGlobalCursor('move');
			e.stopPropagation();
		},

		__onMousedown: function(e) {
			//qx.log.Logger.debug('mousedown');
			var mouseX = e.getDocumentLeft();
			var mode = this.__getMouseMode(mouseX);
			switch (mode) {
			case 0:
				var c = this.__background.getContainerLocation();

				/* Align to raster */
				mouseX = Math.floor(mouseX - ((mouseX - c.left) % this.__rasterPx));

				this.__diffLeft = mouseX - c.left - this.__selectorPosX;
				this.__diffRight = this.__selectorWidth - (mouseX - c.left - this.__selectorPosX);
				this.__moving = true;
				break;

			case - 1: this.__resizingStart = true;
				break;

			case 1:
				this.__resizingEnd = true;
				break;
			}
		},

		/**
         * Change the selection.
         */

		__onMouseup: function(e) {
			//qx.log.Logger.debug('mouseup');
			var mouseX = e.getDocumentLeft();
			if (this.__moving) {
				this.__moving = false;
				this._move(mouseX, true);
			}
			else if (this.__resizingStart) {
				this.__resizingStart = false;
				this.__resizeStart(mouseX, true);
			}
			else if (this.__resizingEnd) {
				this.__resizingEnd = false;
				this.__resizeEnd(mouseX, true);
			}
			this._excludeChildControl('time-selector-feedback');
		},

		/**
         * Resize the selection end.
         */

		__resizeEnd: function(mouseX, execute) {
			var c = this.__background.getContainerLocation();
			mouseX = Math.floor(mouseX - ((mouseX - c.left) % this.__rasterPx));

			var leftsel = c.left + this.__selectorPosX;
			if (mouseX < leftsel) {
				/* end is before start */
				mouseX = leftsel;
			}
			if (mouseX > c.right) {
				mouseX = c.right;
			}

			var posX = this.__selectorPosX;
			var width = mouseX - c.left - posX;

			if (execute) {
				//this.__updateSel(posX,width);
				this._updateTimeSelFromPx(posX, width);
			}
			else {
				this.__updateSelFeedback(posX, width);
			}
		},

		/**
         * Resize the selection start.
         */

		__resizeStart: function(mouseX, execute) {
			var c = this.__background.getContainerLocation();
			mouseX = Math.floor(mouseX - ((mouseX - c.left) % this.__rasterPx));

			var rightsel = c.left + this.__selectorPosX + this.__selectorWidth;
			if (mouseX > rightsel) {
				/* start is behind end */
				mouseX = rightsel - this.__rasterPx;
			}
			if (mouseX < c.left) {
				mouseX = c.left + this.__rasterPx;
			}

			var posX = mouseX - c.left;
			var width = this.__selectorWidth + (this.__selectorPosX - (mouseX - c.left));

			if (execute) {
				//this.__updateSel(posX,width);
				this._updateTimeSelFromPx(posX, width);
			}
			else {
				this.__updateSelFeedback(posX, width);
			}
		},

		/**
         * Move the selection.
         *
         * @param mouseX {Integer} The current position of the mouse.
         * @param execute {Boolean} Should the move be executed? Otherwise
         *                          only the move-feedback will be changed.
         */

		_move: function(mouseX, execute) {
			var c = this.__background.getContainerLocation();

			/* Align to raster */
			mouseX = Math.floor(mouseX - ((mouseX - c.left) % this.__rasterPx));

			var posX = mouseX - this.__diffLeft;

			/* Selector width stays the same */
			var width = this.__selectorWidth;

			/* Widget moved too far? */
			if (mouseX + this.__diffRight > c.right) {
				posX = c.right - width;
			}
			else if (posX < 0) {
				posX = 0;
			}

			////qx.log.Logger.debug("MOVE: Setting width to " + width + " and posX to " + posX);
			if (execute) {
				this._updateTimeSelFromPx(posX, width);
			}
			else {
				this.__updateSelFeedback(posX, width);
			}
		},

		__onMouseout: function(e) {
			this.getApplicationRoot().setGlobalCursor("default");
		},

		/**
         * Determine the current mouse mode, when the mouse is over the selector.
         * Selector Start: -1. None: 0, End: 1
         */

		__getMouseMode: function(mouseX) {
			var widgetX = this.__background.getContainerLocation().left;
			var border = this.self(arguments).SELECTOR_RESIZE_BORDER;
			var scrLeft = this.__selectorPosX + widgetX;
			var scrRight = this.__selectorWidth + scrLeft;

			if (mouseX <= (scrLeft + border) && mouseX >= (scrLeft - border)) {
				return - 1;
				/* mouse is over the area usable to change the selector start */
			}
			else if (mouseX <= (scrRight + border) && mouseX >= (scrRight - border)) {
				return 1;
				/* mouse is over the area usable to change the selector end */
			}
			else if (mouseX < scrLeft - border || mouseX > scrRight + border) {
				return 2;
			}
			else {
				return 0;
			}
		}
	},

	properties: {

		appearance: {
			refine: true,
			init: "timeslider"
		},


		/**
         * The timeFrame displayed by this widget.
         */

		timeFrame: {
			check: 'timeslider.TimeFrame',
			apply: '__applyTimeFrame',
			init: null
		},


		/**
         * The timeFrame that is currently selected.
         */

		timeSelection: {
			check: 'timeslider.TimeFrame',
			apply: '__applyTimeSelection',
			event: 'changeTimeSelection',
			init: null
		},


		/**
         * An array of timeFrames that will be marked in the time slider.
         *
         * NOTE: Used to mark search hits.
         */

		marks: {
			check: 'qx.data.Array',
			apply: '__applyMarks',
			init: new qx.data.Array()
		},


		/**
         * The timeFrame that is the smallest selectable unit in ms.
         * 0 means that there is no raster.
         */

		rasterSize: {
			check: "Integer",
			apply: "__applyRasterSize",
			init: 0
		}
	}
});

