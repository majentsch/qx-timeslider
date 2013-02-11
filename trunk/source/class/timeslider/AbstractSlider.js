
/**
 * An abstract slider that splits an area horizontally, 
 * into an arbitrary amount of parts. A resizable slider can be used
 * to select a range of these areas.
 *
 * The amount of parts which
 */

qx.Class.define('timeslider.AbstractSlider', {

	extend: qx.ui.core.Widget,

	statics: {

		/**
         * The area around the selectors left an right edge, 
         * that can be used to resize.
         */

		SELECTOR_RESIZE_BORDER: 10
	},


	construct: function() {
		this.base(arguments);
		var l = new qx.ui.layout.Canvas();
		this._setLayout(l);
        this.set({
            height: 45,
            width: 800
        });

		this._createChildControl("selector");
		var selector = this.getChildControl('selector');

		this._createChildControl("selector-feedback");
		this._excludeChildControl("selector-feedback");

		/* Refresh the children on widget resize */
		this.addListener('resize', this._onResize, this);

		// Target for draggin is this complete widget.
		this.addListener('mousedown', this.__onMousedown, this);
		this.addListener('mouseout', this.__onMouseout, this);
        this.addListener('mousemove', this.__onMousemove, this);

        this.getApplicationRoot().addListener('mouseup',this.__onMouseup,this);
	},


    properties: {

		appearance: {
			refine: true,
			init: "abstract-slider"
		},


        /**
         * The value of the first part.
         */

        unitOffset: {
            check: "Integer",
            init: 0
        },


        /**
         * The amount of parts displayed by this widget.
         */

        unitCount: {
            check: "Integer",
            apply: "__applyUnitCount"
        },


        /**
         * The selected range. The content must be either
         * null, when no selection is set, or a map
         * containing the following properties:
         *  - start {Integer} The first selected unit.
         *  - end   {Integer} The last selected unit.
         */

        selectionRange: {
            init: null,
            transform: '__transformSelectinoRange',
            event: "changeSelectionRange",
            nullable: true,
            apply: "__applySelectionRange"
        }
    },


	members: {

        // filter invalid selection ranges and return null
        __transformSelectinoRange: function(range){
            if(!range){
                return null;
            }

            var off = this.getUnitOffset();
            if(range && (
                range.start >= range.end || 
                range.start < off ||
                range.end > off + this.getUnitCount())  ){
                qx.log.Logger.debug('TimeSlider: Selection out of range. Defaulting selection range to null.');
                return null;
            }
            return range;
        },


        /**
         * Returns the caption that will be used for the unit
         * that with the number @unit
         */

        _getUnitCaption: function(unit){
            return unit.toString();
        },


		/**
         * Creates all used child widgets.
         */

		_createChildControlImpl: function(id) {
			var control;

			switch (id) {

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

			case 'selector':
				control = new qx.ui.basic.Atom();
				control.setBackgroundColor(qx.theme.manager.Color.getInstance().resolve('slider-selection'));
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

			case 'selector-feedback':
				control = new qx.ui.basic.Atom();
				control.setBackgroundColor(qx.theme.manager.Color.getInstance().resolve('slider-selection'));
				control.setUserBounds(0, 0, 0, 0);
				control.set({
					allowStretchX: false,
					opacity: 0.3,
					zIndex: 1000
				});
				this._add(control);
				break;
            }

			return control || this.base(arguments, id);
		},


		/**
         * Update this element on resizing.
         */

		_onResize: function(e) {
			var bounds = e.getData();
            var range, count;
            this._widthPx = bounds.width;

            if ( (range = this.getSelectionRange()) && (count = this.getUnitCount()) ) {
                //refresh the position of the selector
                this._positionSelector(range.start,range.end,false);
                this._renderBackground(count ,bounds.width, bounds.height);
			}
		},


		/**
         * Sets the position and the width of the selector to fit the
         * start and end. Also updates the cached value of the selector
         * posX and width.
         *
         * @param start {Integer} the first selected part.
         * @param end {Integer} the last selected part.
         * @param preview {Integer} move only the feedback.
         */

		_positionSelector: function(start,end,feedback) {
            var pxPerUnit = this._getUnitPx();
            start -= this.getUnitOffset();
            end -= this.getUnitOffset();

            var startPx = this.__selectorPosX = Math.floor(pxPerUnit * start);
            var widthPx = this.__selectorWidth = Math.floor(pxPerUnit * (end - start));

            if(!feedback){
                this.__updateSel(startPx,widthPx);
            }
            else
            {
                this.__updateSelFeedback(startPx,widthPx);
            }
		},


		__updateSel: function(x, width) {
			this.getChildControl('selector').
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
			this._showChildControl('selector-feedback');
			this.getChildControl('selector-feedback').setUserBounds(x, 0, width, this.getHeight());
		},


		/**
         * Create the html of the qx.ui.embed.Html that is used 
         * to display the background.
         *
         * @param count {Integer} The amount of displayed widgets.
         * @param width {Integer} The width of the background in width.
         * @param height {Integer} The height of the background in width.
         */

		_renderBackground: function(count, width, height) {
			if (!count) {
				return;
			}

            var offs = this.getUnitOffset();
            var last = offs + count;

			/**
             * Create the html for the background
             */
			var cutil = qx.util.ColorUtil;
			var borderCol = qx.theme.manager.Color.getInstance().resolve('slider-border');
			var html = '<table border=1 rules=all width=' + width + ' height=' + height + ' bordercolor="' + borderCol + '"; style="border-collapse:collapse; table-layout:fixed;">';


            for (var i = this.getUnitOffset(); i < last; i++) {
                html += 
                    '<th>' + qx.log.appender.Util.escapeHTML(this._getUnitCaption(i)) + '</th>';
			}
			this.getChildControl('background').setHtml(html);
		},

        __applyUnitOffset: function(offs){

            // reset the selection if its out of range
            var sel = this.getSelectionRange();
            if(offs > sel.end || sel.start ){
                var sel = {
                    start: offs,
                    end: offs + 1
                };
                this.setSelectionRange(sel);
            }
            else{
                var bounds = this.getBounds();
                var sel = this.getSelectionRange();
                if (!bounds || !sel) {
                    return;
                }

                this._renderBackground(this.getUnitCount(),bounds.width,bounds.height);
                this._positionSelector(sel.start,sel.end,true);
            }
        },

		__applyUnitCount: function(count) {
			if (!count) {
				return;
			}
            var range;

			var bounds = this.getBounds();
			if (!bounds) {
				return;
			}

			this._renderBackground(count, bounds.width, bounds.height);
			if (range = this.getSelectionRange()) {
                this._positionSelector(range.start,range.end,true);
			}
		},


		__applySelectionRange: function(range,old) {
            if(!range){
                // range is null, hide selection
                this._excludeChildControl('selector');
                return;
            }
            else if(!old){
                this._showChildControl('selector');
            }

            if (
                !this.getBounds() || 
                ((range.start === (old && old.start)) && (range.end === (old && old.end)))
            ){
                qx.log.Logger.debug('__applySelectionRange: same range again. not updating...');
				return;
			}
            var bounds = this.getBounds()
            this._renderBackground(this.getUnitCount(),bounds.width,bounds.height);
            this._positionSelector(range.start,range.end,true);
            qx.log.Logger.debug('New selection range ' + range.start + ' to ' + range.end);
		},

        
		/**
         * Display the marks.
         */

		_applyMarks: function(marks) {
			throw new Error("__applyMarks is not implemented!");
		},


		/* ********************************************************************
                                    DRAG AND DROP
           ******************************************************************* */

		__moving: false,
		__resizingStart: false,
		__resizingEnd: false,

		// the space between the selector borders and the mouse on first click
		__diffLeft: 0,
		__diffRight: 0,

        // cache current selector position for faster access
        __selectorPosX: 0,
        __selectorWidth: 0,

		__onMousemove: function(e) {
            // Get the mouse x relative to the widget start.
            var loc = this.getContainerLocation('box');

            if(!loc){
                return;
            }

            var mouseX = e.getDocumentLeft() - loc.left;

			if (this.__moving) {
				////qx.log.Logger.debug('currently moving');
				// Update the drag feedback
				this._move(mouseX, false);
			}
			else if (this.__resizingStart) {
				//qx.log.Logger.debug('currently resizing the start');
				// Update the drag feedback
				this.__resizeStart(mouseX, false);
			}

			else if (this.__resizingEnd) {
				//qx.log.Logger.debug('currently resizing the end');
				// Update the drag feedback
				this.__resizeEnd(mouseX, false);
			}
			else {
				var mode = this.__getMouseMode(mouseX);
				var cursor = mode === 2 ? 'default': mode !== 0 ? 'ew-resize': 'pointer';
				//qx.log.Logger.debug('changing the cursor to ' + cursor);
				this.getApplicationRoot().setGlobalCursor(cursor);
				return;
			}
			this.getApplicationRoot().setGlobalCursor('move');
			e.stopPropagation();
		},


		__onMousedown: function(e) {
            // Get the mouse x relative to the widget start.
            var mouseX = e.getDocumentLeft() - this.getContainerLocation('box').left;

			var mode = this.__getMouseMode(mouseX);
			switch (mode) {
			case 0:
				this.__diffLeft = mouseX - this.__selectorPosX;
				this.__diffRight = this.__selectorWidth - (mouseX - this.__selectorPosX);
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
            // Get the mouse x relative to the widget start.
            var mouseX = e.getDocumentLeft() - this.getContainerLocation('box').left;

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
			this._excludeChildControl('selector-feedback');
		},


		/**
         * Resize the selection end.
         */

		__resizeEnd: function(mouseX, execute) {
            var startUnit = this.getSelectionRange().start;
            var endUnit = this._pxToUnit(mouseX);
            var border = this.getUnitCount() + this.getUnitOffset();

            if(startUnit >= endUnit){
                endUnit = startUnit + 1;
            }
            if(endUnit > border){
                endUnit = border;
            }

            if(execute){
                //update the selection
                this.setSelectionRange(
                    { 
                        start: startUnit, 
                        end: endUnit 
                    });
            }

            this._positionSelector(startUnit,endUnit,!execute);
		},


		/**
         * Resize the selection start.
         */

		__resizeStart: function(mouseX, execute) {
            var startUnit = this._pxToUnit(mouseX);
            var endUnit = this.getSelectionRange().end;
            var off = this.getUnitOffset();
            
            if(startUnit <= off){
                startUnit = off;
            }

            if(startUnit >= endUnit){
                startUnit = endUnit - 1;
            }
        
            if(execute){
                //update the selection
                this.setSelectionRange(
                    { 
                        start: startUnit, 
                        end: endUnit 
                    });
            }
            this._positionSelector(startUnit,endUnit,!execute);
		},


		/**
         * Move the selection.
         *
         * @param mouseX {Integer} The current position of the mouse.
         * @param execute {Boolean} Should the move be executed? Otherwise
         *                          only the move-feedback will be changed.
         */

		_move: function(mouseX, execute) {
            var oldRange = this.getSelectionRange();
            var width = oldRange.end - oldRange.start;

            var lowerBorder = this.getUnitOffset();
            var upperBorder = lowerBorder + this.getUnitCount();

            var startUnit = this._pxToUnit(mouseX - this.__diffLeft);

			/* Widget moved too far? */
            if (startUnit + width > upperBorder) {
                startUnit = upperBorder - width;
			}
			else if (startUnit < lowerBorder) {
				startUnit = lowerBorder;
			}

            var endUnit = startUnit + width;

            if(execute){
                //update the selection
                this.setSelectionRange(
                    { 
                        start: startUnit, 
                        end: endUnit 
                    });
            }
            this._positionSelector(startUnit,endUnit,!execute);
		},


		__onMouseout: function(e) {
			this.getApplicationRoot().setGlobalCursor("default");

		},


		/**
         * Determine the current mouse mode, when the mouse is over the selector.
         * Selector Start: -1. None: 0, End: 1
         *
         * @params mouseX {Integer} The mouse-x position relative to the widget in px.
         */

		__getMouseMode: function(mouseX) {
			var border = this.self(arguments).SELECTOR_RESIZE_BORDER;
			var scrLeft = this.__selectorPosX;
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
		},



        /*************************************************************
                                CONVERSION
         *********************************************************** */

        _widthPx: 0,


        /**
         * Return the current count of px per unit. This 
         * is not an integer to achiever higher accuracy.
         */
        
        _getUnitPx: function(){
            return this._widthPx / this.getUnitCount();
        },


        /**
         * Calculate the discrete value that corresponds to a certain pixel-value.
         */

        _pxToUnit: function(px){
            return this.getUnitOffset() + Math.floor(  px / this._getUnitPx() );
        }
	}
});

