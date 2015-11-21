// es5 and 6 polyfills, powered by babel
require("babel/polyfill")

let fetch = require('./fetcher')

var $ = require('jquery'),
    Backbone = require('backbone');

console.log("JS has loaded");


var WeatherModel = Backbone.Model.extend({ //constructor

    //because the forecast.io is a NON-Restful API so we use a function 
    //that will return the URL 

    url: function() {
        return "https://api.forecast.io/forecast/6ca87b04c7404d6e91663373e86b9061/" + this.coords
    },

    defaults: {
        name: "",

        icons: {
            "clear-day": "wi-day-sunny",
            "clear-night": "wi-night-clear",
            "rain": "wi-rain",
            "snow": "wi-snow",
            "sleet": "wi-sleet",
            "wind": "wi-cloudy-gusts",
            "fog": "wi-fog",
            "cloudy": "wi-cloudy",
            "partly-cloudy-day": "wi-day-cloudy",
            "partly-cloudy-night": "wi-night-partly-cloudy"
        }
    }


})




//the view knows how to listen to events, 
//how to render and present the information
//and it is responsible for writing to the DOM

var CurrentView = Backbone.View.extend({ //constructor

    el: "#container", //we need to give the events
    //a scope in which they ocuure.  so the input occures in the #container
    //?????????

    events: {
        "keypress input": "getUserQuery"
    },

    getUserQuery: function(event) {
        if (event.keyCode === 13) {
            var query = event.target.value;
            location.hash = `forecast/current/${query}`
        }
    },

    getCurrentPlace: function() {

        return this.model.attributes.name
    },

    getCurrentTemp: function() {
        return this.model.attributes.currently.temperature + " F"
    },


    getCurrentIcon: function() {
        var icon = this.model.attributes.currently.icon
        var iconsArr = this.model.attributes.icons
        console.log(iconsArr[icon])
        return iconsArr[icon]
    },

    getCurrentSummary: function() {
        return this.model.attributes.currently.summary
    },


    render: function() {
        console.log(this);
        $('#weather-container').html(`<h4 class="place">${this.getCurrentPlace()}</h4>
        <h4>${this.getCurrentTemp()}</h4>
        <i class="wi ${this.getCurrentIcon()}"></i>
        <h4>${this.getCurrentSummary()}</h4>`);
       

        $('#weather-container').css('width', '350px');
        $('.wi').css('color', '#4679b2');


    },


})


var WeeklyView = Backbone.View.extend({

    getWeeklyPlace: function() {

        return this.model.attributes.name
    },

    getWeeklyTemp: function(day) {
        return day.temperatureMin + "-" + day.temperatureMax
    },


    getWeeklytIcon: function(day) {

        var iconsArr = this.model.attributes.icons
        // console.log(iconsArr[day.icon])
        return iconsArr[day.icon]
    },

    getWeeklySummary: function(day) {
        return day.summary;
    },

    getD:function(day){
        var daysArr=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        var d=new Date(day.time*1000)
        return daysArr[d.getUTCDay()]+" "+d.getUTCMonth()+"/"+d.getUTCDate();
    },


    render: function() {
        var week = this.model.attributes.daily.data;
        console.log(week)
        var self = this
        var htmlString = `<h4 class="place">${this.getWeeklyPlace()}</h4>`;
        week.forEach(function(day) {
            htmlString += `<div id="day">
            <p>${self.getD(day)}</p>
            <i class="wi ${self.getWeeklytIcon(day)}"></i>
            <P>${self.getWeeklyTemp(day)}</P></div>`
        })

        $('#weather-container').html(htmlString);
        $('#weather-container').css({
            width: '1200px',
            borderRadius:'1%'});

    }
})

var HourlyView = Backbone.View.extend({

    getHourlyPlace: function() {

        return this.model.attributes.name
    },

    getTimeofDay: function(hour) {

        var d = new Date(hour.time * 1000)
        return d.getHours() + ":00"
    },

    getHourlyTemp: function(hour) {
        return hour.temperature
    },


    // getCurrentIcon: function() {

    // },

    getHourlySummary: function(hour) {
        return hour.summary;
    },


    render: function() {

        var summary = this.model.attributes.hourly.summary
        var hours = this.model.attributes.hourly.data;

        var self = this
        
             var htmlString = `<h4 class="place">${this.getHourlyPlace()}</h4>
             <h5>NEXT 24 HOURS: ${summary}</h5>`

        for (var i = 0; i < 8; i++) {
            htmlString += `<div class="hour">
            <p class="time">${self.getTimeofDay(hours[i])}</p>
            <P class="temp">${self.getHourlyTemp(hours[i])}</P>
            <P>${self.getHourlySummary(hours[i])}</P>
            </div>`
        }

        $('#weather-container').html(htmlString);
        $('#weather-container').css({
            width: '950px',
            borderRadius:'4%'});
        


        

        
    },

})


//the controller-router.
//IT is like Traffic cop. as soon as it see's a change in the location.hash
//it imidiatly looks for the route in his list of routs
//and directs it to the relevant function

var WeatherRouter = Backbone.Router.extend({

    routes: {
        'forecast/Current/:query': 'showCurrentWeather',
        'forecast/Weekly/:query': 'showWeeklyWeather',
        'forecast/Hourly/:query': 'showHourlyWeather',
        '*anyroute': 'showDefault'

    },

    showDefault: function() {
        self = this
        if (navigator.geolocation) {
            var latLon = navigator.geolocation.getCurrentPosition(function(position) {
                var lat = position.coords.latitude;
                var lon = position.coords.longitude;
                self.doAjaxForAddress(lat + "," + lon)

            });

        } else {
            // Print out a message to the user.
            document.write('Your browser does not support GeoLocation');
        }

    },

    doAjaxForAddress: function(latLon) {
        var ajaxParams = {
            url: `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latLon}&key=AIzaSyDvxp50Q2XT1q1dlDtSeoeyfegzwZvu9fw`,
            success: function(responseData) {
                location.hash = `forecast/Current/${responseData.results[0].formatted_address}`
            }
        }

        return $.ajax(ajaxParams)
    },

    doAjax: function(query, ViewName) {
        // var self = this
        // console.log(query);
        var ajaxParams = {
            url: `https://maps.googleapis.com/maps/api/geocode/json?address=${query}`,
            success: this.getForcast.bind(this, ViewName)

            // self.getForcast(responseData,funcName)
            // }
            //because success is executing the getForcast, and we
            //use "this" there, the scope is of the success function and not
            //of router. the solution to that is by using .bind and send it the 
            //scope we want.

        }
        return $.ajax(ajaxParams)

    },

    showCurrentWeather: function(query) {

        this.doAjax(query, 'currentView')
    },

    showWeeklyWeather: function(query) {
        this.doAjax(query, 'weeklyView')
    },

    showHourlyWeather: function(query) {
        this.doAjax(query, 'hourlyView')
    },

    getForcast: function(ViewName, responseData) {
        var location = responseData.results[0].geometry.location;
        var lat = location.lat,
            lng = location.lng;
        var place = responseData.results[0].formatted_address

        this.weather.set("name", place)

        this.weather.coords = `${lat},${lng}`
            // console.log(this.weather.coords)
        var self = this;

        this.weather.fetch({
                dataType: 'jsonp'
            })
            .success(function() {
                self[ViewName]['render']()
            })

    },

    initialize: function() {
        // console.log('init');
        //** this-does it mean the object router?
        this.weather = new WeatherModel();
        //we want to attach the model as a property to the view:
        this.currentView = new CurrentView({
            model: this.weather
        })
        this.weeklyView = new WeeklyView({
            model: this.weather
        })

        this.hourlyView = new HourlyView({
                model: this.weather
            })
            // window.wv = this.week

        Backbone.history.start() //important! routing will not work without this.s
            // console.log(this);

    }



})

//the whole chain of commands starts from this line:
var router = new WeatherRouter()

$('#currently').on('click', function() {
    location.hash=location.hash.replace(/forecast\/.*\//,'forecast/Current/')
})
$('#hourly').on('click', function() {
    location.hash=location.hash.replace(/forecast\/.*\//,'forecast/Hourly/')
    // router.hourlyView.render()
})
$('#weekly').on('click', function() {
    location.hash=location.hash.replace(/forecast\/.*\//,'forecast/Weekly/')
})

//it then continues to to the initialization of the Router object (line 70)
//and creating new "model" and "view" which are attached to the router
//object as proprties (lines 73,75)
//in line 75, we initialize the view with a property wich is
//the Model, so when the view object will be created, it will automatically 
//have a property called model, which has a refference to our model.
