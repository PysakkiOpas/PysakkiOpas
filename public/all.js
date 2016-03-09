var PysakkiopasApp = angular.module('PysakkiopasApp', ['ui.router']);

PysakkiopasApp.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/");
        
    $stateProvider
        .state('main', {
            url: '/',
            templateUrl: 'app/components/main/main.html',
            controller: 'MainController'
        })
});

PysakkiopasApp.controller("MainController", function($scope, StopsService, RouteService) {
    var skipAmount = 0;
    var lat;
    var lng;
    var directionsService;
    var directionsDisplay;
    
    $scope.coordinates = "lat: x, lng: y";
    $scope.info = "";
    $scope.input = "";
    
    // stops are fetched locally from stops.txt file
    $scope.stops = StopsService.getStops();
    
    $scope.init = function() {
        directionsService = new google.maps.DirectionsService();
        directionsDisplay = new google.maps.DirectionsRenderer();
        var mapOptions = {
            zoom: 16,
            center: new google.maps.LatLng(60.174280, 24.960710)
        };
        var map = new google.maps.Map(
                document.getElementById('map-canvas'), mapOptions);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                lat = position.coords.latitude;
                lng = position.coords.longitude;
                directionsDisplay.setMap(map);
                $scope.closestStop();
                map.setCenter(pos);
            });
        }
        google.maps.event.addListener(map, "rightclick", function (event) {
            lat = event.latLng.lat();
            lng = event.latLng.lng();
            skipAmount = 0;
            // document.getElementById('coordinates').innerHTML = "lat: " + lat + ", lng: " + lng;
            $scope.coordinates = "lat: " + lat + ", lng: " + lng;
            directionsDisplay.setMap(map);
            $scope.closestStop();
        });
    }
    
    $scope.nextStop = function() {
        skipAmount++;
        RouteService.closestStop();
    }
    
    $scope.previousStop = function() {
        if (skipAmount > 0) {
            skipAmount--;
        }
        RouteService.closestStop();
    }
    
    $scope.closestStop = function() {
        skipAmount = 0;
        RouteService.closestStop();
    }
    
    $scope.searchStop = function() {
        RouteService.getRoute($scope.info, $scope.input);
    }
})
PysakkiopasApp.service("RouteService", function($http) {

    this.closestStop = function() {
        console.log("closest stop!");
    }

// criminally abhorrent method    
    this.closestStop2 = function(stops) {
        // the object to be returned
        var stop = {};
        
        var count = 0, currentStop = "", currentStop = "", link = "", stack = [], id = "";

        for (var i = 0, max = stops.length; i < max; i++) {
            if (stops.charAt(i) === ",")
                count++;
            if (count === 0) {
                id = id + stops.charAt(i);
            }
            if (count === 3)
                currentStop = currentStop + stops.charAt(i);
            if (count === 4) {
                var currentStopLat = parseFloat(stops.substr(i + 1, 9)), currentStopLng = parseFloat(stops.substr(i + 11, 9));
                var currentLatDifference = Math.abs(currentStopLat - lat), currentLngDifference = Math.abs(currentStopLng - lng);

                link = stops.substr(i + 23, 48);
                currentStop = currentStop.substr(2, currentStop.length - 3);
                var newStop = new stop(currentStopLat, currentStopLng, currentStop, link, (currentLatDifference + currentLngDifference), id);
                stack.push(newStop), count++, i = i + 20, currentStop = "", id = "";

            }
            if (count === 10)
                count = 0;
        }
        
        stack.sort(function (a, b) {
            return b.difference - a.difference;
        });
        for (var i = 0, max = skipAmount; i < max; i++) {
            stack.pop();
        }
        var s = stack.pop();

        document.getElementById('info').innerHTML = "Lähin pysäkki: " + s.name;
        var a = document.getElementById('top');
        a.innerHTML = "Pysäkin aikataulut (ohjaa HSL:n sivuille)";
        a.href = s.link;


        calculateAndDisplayRoute(s.lat, s.lng);
        var timeTable = getTimes(s.id);
        var old = document.getElementById("bustimes"), loops = timeTable.length;
        old.innerHTML = "";
        if (loops === 0) {
            document.getElementById("bustimes").innerHTML = "Ei löytynyt aikoja seuraavaan kahteen tuntiin."
        }
        for (var i = 0, max = loops; i < max; i++) {
            var para = document.createElement("p");
            var bus = timeTable[i].bus, b = timeTable[i].bus;
            if (b.charAt(1) === '0') {
                bus = b.substr(2, 2);
            } else if (b.charAt(3).match(/[a-z]/i)) {
                bus = b.substr(0, 3);
            } else {
                bus = b.substr(1, 4);
            }
            var time = timeTable[i].time, hours, minutes;
            if (time.length === 4) {
                hours = time.substr(0, 2);
                minutes = time.substr(2, 2);
                if (hours === "24") {
                    hours = 00;
                } else if (hours === "25") {
                    hours = 01;
                }
            } else {
                hours = time.substr(0, 1);
                minutes = time.substr(1, 2);
            }

            var node = document.createTextNode(bus + " / " + hours + ":" + minutes + " --> " + timeTable[i].destination);
            para.appendChild(node);
            var element = document.getElementById("bustimes");
            element.appendChild(para);
        }
    }
    
    this.getRoute = function(info, input) {
        console.log("getroute!");
    }
})
PysakkiopasApp.service("StopsService", function() {
    // stops is a one massive string?
	this.stops = "";
	
    this.init = function() {
        var client = new XMLHttpRequest();
        client.open('GET', 'app/components/main/stops.txt');
        client.onreadystatechange = function () {
            this.text = client.responseText;
        };
        client.send();
    }
    
	this.getStops = function() {
		return this.stops;
	}
    
    this.init();
})