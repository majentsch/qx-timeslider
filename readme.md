TimeSlider
==========

The TimeSlider is a widget, that allows the user to select a certain time frame
using a resizable slider.

![TimeSlider](http://blog.netways.de/wp-content/uploads/2012/12/timeSlider11.png "TimeSlider")]


### Installation ###

Clone this repository and include it like any other qooxdoo library. 
(See http://manual.qooxdoo.org/current/pages/development/library_custom.html#using-the-library )


### Usage ###

    var timeSlider = new timeslider.TimeSlider();

    // Set the smallest selectable unit to one day
    timeSlider.setRasterSize(86400000);

    // Set the selectable time frame
    timseSlider.setTimeFrame(new Date(2012,6,1), new Date(2012,12,1));

    // Set the selected time frame
    timseSlider.setTimeSelection(new Date(2012,8,1), new Date(2012,8,15));
