/* ***************************************
 *
 * #use(timeslider.AbstractSlider)
 *
 * ************************************* */


qx.Class.define('timeslider.TimeSlider',
{
    extend: timeslider.AbstractSlider,

    construct: function(timeFrame,unitType){
        this.base(arguments);
        this.setUnitType(unitType || 'month');
        this.setTimeFrame(timeFrame);

        this.addListener('changeSelectionRange',function(e){
            this.__updateTimeSelection(e.getData());           
        },this);
    },

    
    properties: {

        timeFrame: {
            init: null,
            apply: '__applyTimeFrame',
            event: 'changeTimeFrame'
        },


        timeSelection: {
            init: null,
            apply: '__applyTimeSelection',
            event: 'changeTimeSelection'
        },


        unitType: {
            check: ['year','month','week','day','hour'],
            apply: '__applyUnitType',
            init: 'month'
        }
    },


    members: {

        /** 
         * normalized Date objects to represent start, end and selection
         */

        __start: null,
        __end: null,
        __selectionStart: null,
        __selectionEnd: null,


        __applyTimeFrame: function(timeFrame){
            this.__start = this._normalizeDate(timeFrame.getStart());
            this.__end = this._normalizeEndDate(timeFrame.getEnd());
    
            //update amount of displayed units
            var unitCount = this._calcUnitCount(this.__start,this.__end);
            this.setUnitCount(unitCount);

            //update position of the selector
            if(this.__selectionStart && this.__selectionEnd){
                this.__updateSelectorPos();
            }
        },


        __applyTimeSelection: function(timeSelection){
            this.__selectionStart = this._normalizeDate(timeSelection.getStart());
            this.__selectionEnd = this._normalizeEndDate(timeSelection.getEnd());
            this.__updateSelectorPos();
        },


        __updateSelectorPos: function(){
       
            if(!this.__internalUpdate){
                var startPos = this._calcUnitCount(this.__start,this.__selectionStart) - 1;
                var endPos = this._calcUnitCount(this.__start,this.__selectionEnd);
                var unitCount = this.getUnitCount();

                //the timeSelection was changed externally by setting the
                //property and therefore the selection rang in the base
                //class must be refreshed.

                if(startPos >= 0 && endPos <= unitCount){
                    this.setSelectionRange({
                        start: startPos,
                        end: endPos
                    });
                }
                else{
                    this.setSelectionRange({
                        start: 0,
                        end: 1
                    });
                }
            }
        },


        /**
         * Update the timeSelection to fit the selectionRange, when 
         * the selectionRange was changed by the user, using the
         * base object of this class.
         */

        __updateTimeSelection: function(selectionRange){
            this.__internalUpdate = true;
            this.setTimeSelection( 
                new timeslider.TimeFrame(
                    this._normalizeDate( 
                        this._unitToDate(selectionRange.start)),
                    this._normalizeEndDate(
                        this._unitToDate(selectionRange.end))
                )
            );
            this.__internalUpdate = false;
        },
        
        __applyUnitType: function(type){
          

            /**
             * Set the conversion functions.
             */

            switch(type){

                case 'year':
                    this._unitToDate = function(unit){
                        var d = new Date(this.__start.getTime());
                        d.setFullYear( d.getFullYear() + (unit - this.getUnitOffset()) );
                        return d;
                    };
                    this._getUnitCaption = function(unit){
                        return this._unitToDate(unit).getFullYear();
                    };
                    this._normalizeDate = function(date){
                        return new Date(date.getFullYear(),0,1,0,0,0,0);
                    };
                    this._calcUnitCount = function(start,end){
                        return 1 + end.getFullYear() - start.getFullYear();
                    };
                    this._incrDate = function(date){
                        date.setFullYear(date.getFullYear() + 1);
                    };
                    break;


                case 'month':
                    this._unitToDate = function(unit){
                        var d = new Date(this.__start.getTime());
                        d.setMonth(d.getMonth() + (unit - this.getUnitOffset()));
                        return d;
                    };
                    this._getUnitCaption = function(unit){
                        return qx.locale.Date.getMonthName(
                            'abbreviated',
                            this._unitToDate(unit).getMonth());
                    };
                    this._normalizeDate = function(date){
                        return new Date(date.getFullYear(),date.getMonth(),1,0,0,0,0);
                    };
                    this._calcUnitCount = function(start,end){
                        var yS = start.getFullYear();
                        var yE = end.getFullYear();
                        return ((yE - yS) * 12 ) + (end.getMonth() - start.getMonth()) + 1;
                    };
                    this._incrDate = function(date){
                        date.setMonth(date.getMonth() + 1);
                    };
                    break;
                    

                /**
                 * TODO: Implement week
                 */
                case 'week':
                    this._getUnitCaption = function(unit){
                        var d = new Date(this.__start.getTime());
                        d.setYear(d.getFullYear() + (unit - this.getUnitOffset()));
                        return d;
                    };
                    this._normalizeDate = function(date){
                        return new Date(date.getFullYear(),0,0,0,0,0,0);
                    };
                    this._calcUnitCount = function(start,end){
                        return 1 + end.getFullYear() - start.getFullYear();
                    };
                    this._incrDate = function(date){
                        date.setFullYear(date.getFullYear() + 1);
                    };
                    break;


                case 'day':
                    this._getUnitCaption = function(unit){
                        var d = new Date(this.__start.getTime());
                        d.setDate(d.getDate() + (unit - this.getUnitOffset()));
                        return d;
                    };
                    this._normalizeDate = function(date){
                        return new Date(date.getFullYear(),date.getMonth(),date.getDate(),0,0,0,0);
                    };
                    this._calcUnitCount = function(start,end){
                        var daysPerYear = function(year){
                            return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365;
                        };
                        var daysPerMonth = function(m,year){
                            if(m == 0 || m == 2 || m == 4 || m == 6 || m == 7 || m == 9 || m == 11){
                                return 31;
                            }
                            else if(m == 1){
                                return daysPerYear(year) === 366 ? 29 : 28;
                            }
                            else{
                                return 30;
                            }
                        };

                        var ys = start.getFullYear();
                        var ye = end.getFullYear();

                        //calc all days in the years
                        var days = 0;
                        for(var i=ys; i<ye; i++){
                            days += daysPerYear(ys + i);
                        }

                        //calc all days in the months
                        var ms = start.getMonth();
                        var me = end.getMonth();

                        //Remove the days of the start-month
                        for(i=0; i<ms; i++){
                            days -= daysPerMonth(i,start.getFullYear());
                        }

                        //Add the days of the end-month
                        for(var j=0; j<me; j++){
                            days += daysPerMonth(j,end.getFullYear());
                        }


                        return 1 + (end.getDate() - start.getDate()) + days;
                    };
                    break;


                case 'hour':
                    this._getUnitCaption = function(unit){
                        var d = new Date(this.__start.getTime());
                        d.setHours(d.getHours() + (unit - this.getUnitOffset()));
                        return d;
                    };
                    this._normalizeDate = function(date){
                        return new Date(date.getFullYear(),date.getMonth(),date.getDate(),date.getHours(),0,0,0);
                    };
                    this._calcUnitCount = function(start,end){
                        return 1 + end.getFullYear() - start.getFullYear();
                    };
                    break;
            }
        },


        /**
         * Should calculate the amount of the currently selected units 
         * between the start and the end date.
         */

        _calcUnitCount: function(start,end){
            throw "ERROR: No unit type selcted.";
        },


        /**
         * Should return the name for @unit
         */

        _getUnitCaption: function(unit){
            return "";       
        },


        _normalizeDate: function(date){
            throw "ERROR: No unit type selcted.";
        },


        _normalizeEndDate: function(date){
            var d = this._normalizeDate(date);
            this._incrDate(d);
            d.setTime(d.getTime() - 1);
            return d;
        }
    }
});
