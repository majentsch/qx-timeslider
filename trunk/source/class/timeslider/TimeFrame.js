qx.Class.define('timeslider.TimeFrame',{
  extend: qx.core.Object,

  construct: function(start,end){
    this.setStart(start);
    this.setEnd(end);
  },

  members: {
    toString: function(){
      return " Start: " + this.getStart() + 
      " End: " + this.getEnd();
    }
  },

  properties: {

    start: {
      check: "Date",
      event: "changeStart"
    },

    end: {
      check: "Date",
      event: "changeEnd"
    }
  }
});
