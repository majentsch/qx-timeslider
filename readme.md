qx-TimeSlider
============

The TimeSlider is a widget, that allows the user to select a certain time frame
using a resizable slider.


### Installation ###

- Clone this repository and include it like any other qooxdoo library 
     http://manual.qooxdoo.org/current/pages/development/library_custom.html#using-the-library

- The widget will now be available in the timeslider namespace of your project.


### Usage ###


<!-- language: lang-js -->


	//Include the appearances from the contribution
	qx.Theme.include(YOUR_APPLICATION_NAMESPACE.theme.Appearance, timeslider.theme.Appearance);

	//Include the colors from the contribution
	qx.Theme.include(YOUR_APPLICATION_NAMESPACE.theme.Color, timeslider.theme.Color);


	// Create a slider to display the years 2010 - 2020
        var sliderYear = new timeslider.TimeSlider( 
        	new timeslider.TimeFrame(
			new Date(2010,1,1),
                	new Date(2020,1,1)),
                	'year');
        sliderYear.setTimeSelection( 
		new timeslider.TimeFrame(new Date(2012,11,1),new Date(2013,2,1)));


	// Create a slider to display the months Jul. 2010 - Jul. 2011 
        var sliderMonth = new timeslider.TimeSlider( 
        	new timeslider.TimeFrame(
			new Date(2010,6,1),
		        new Date(2011,6,1)),
		        'month');
        sliderMonth.setTimeSelection(
		new timeslider.TimeFrame(new Date(2012,11,1),new Date(2013,2,1)));


	var doc = this.getRoot();
	doc.add(sliderYear, {
		left: 100,
		top: 50,
		right: 100
	});
	doc.add(sliderMonth, {
		left: 100,
		top: 150,
		right: 100
	});
