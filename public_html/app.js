var text, skipAmount = 0, lat, lng, directionsService, directionsDisplay;
var client = new XMLHttpRequest();
client.open('GET', 'stops.txt');
client.onreadystatechange = function () {
    text = client.responseText;
};
client.send();

function initialize() {
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
            closestStop(directionsService, directionsDisplay, lat, lng);
            map.setCenter(pos);

        });
    }

    google.maps.event.addListener(map, "rightclick", function (event) {
        lat = event.latLng.lat();
        lng = event.latLng.lng();
        skipAmount = 0;
        document.getElementById('coordinates').innerHTML = "lat: " + lat + ", lng: " + lng;
        directionsDisplay.setMap(map);
        closestStop(directionsService, directionsDisplay, lat, lng);
    });
}


function closestStop(directionsService, directionsDisplay, lat, lng) {
    var count = 0, closestLat = 99, closestLng = 99, closestStopName = "", currentStop = "", link = "", stack = [];

    for (var i = 0, max = text.length; i < max; i++) {
        if (text.charAt(i) === ",") {
            count++;
        }
        if (count === 3) {
            currentStop = currentStop + text.charAt(i);
        }
        if (count === 4) {
            var currentStopLat = parseFloat(text.substr(i + 1, 9));
            var currentStopLng = parseFloat(text.substr(i + 11, 9));

            var currentLatDifference = Math.abs(currentStopLat - lat);
            var currentLngDifference = Math.abs(currentStopLng - lng);

            var closestLatDifference = Math.abs(closestLat - lat);
            var closestLngDifference = Math.abs(closestLng - lng);
            link = text.substr(i + 23, 48);
            closestLat = currentStopLat;
            closestLng = currentStopLng;
            closestStopName = currentStop;
            closestStopName = closestStopName.substr(2, closestStopName.length - 3);
            var newStop = new stop(currentStopLat, currentStopLng, closestStopName, link, (currentLatDifference + currentLngDifference));
            stack.push(newStop);
            count++;
            i = i + 20;
            currentStop = "";
        }
        if (count === 10) {
            count = 0;
        }
    }
    console.log(skipAmount);
    var compare = function (a, b) {
        return b.difference - a.difference;
    };
    stack.sort(compare);
    for (var i = 0, max = skipAmount; i < max; i++) {
        stack.pop();
    }
    var s = stack.pop();
    console.log(s.name);
    document.getElementById('info').innerHTML = "Lähin pysäkki: " + s.name;
    var a = document.getElementById('top');
    a.innerHTML = "Pysäkin aikataulut (ohjaa HSL:n sivuille)";
    a.href = s.link;
    calculateAndDisplayRoute(directionsService, directionsDisplay, s.lat, s.lng, lat, lng);
}

function calculateAndDisplayRoute(directionsService, directionsDisplay, closestLat, closestLng, lat, lng) {
    directionsService.route({
        origin: new google.maps.LatLng(lat, lng),
        destination: new google.maps.LatLng(closestLat, closestLng),
        travelMode: google.maps.TravelMode.WALKING
    }, function (response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsDisplay.setOptions({preserveViewport: true});
            directionsDisplay.setDirections(response);
            document.getElementById('distance').innerHTML = "Matkan pituus: " + directionsDisplay.directions.routes[0].legs[0].distance.text;
        } else {
        }
    });
}

function stop(lat, lng, name, link, difference) {
    this.lat = lat;
    this.lng = lng;
    this.name = name;
    this.link = link;
    this.difference = difference;
}

document.getElementById("next").addEventListener("click", function () {
    skipAmount++;
    closestStop(directionsService, directionsDisplay, lat, lng);
});
document.getElementById("previous").addEventListener("click", function () {
    if (skipAmount > 0) {
        skipAmount--;
    }
    closestStop(directionsService, directionsDisplay, lat, lng);
});
document.getElementById("closest").addEventListener("click", function () {
    skipAmount = 0;
    closestStop(directionsService, directionsDisplay, lat, lng);
});
document.getElementById("furthest").addEventListener("click", function () {
    skipAmount = 7583;
    closestStop(directionsService, directionsDisplay, lat, lng);
});