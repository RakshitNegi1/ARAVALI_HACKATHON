document.getElementById("cabForm").addEventListener("submit", function(event) {
    event.preventDefault();
    calculateDistance();
});

// Initialize the Map
function initMap() {
    var map = L.map('map').setView([28.7041, 77.1025], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    window.map = map;
    window.routeLayer = L.layerGroup().addTo(map);
}

// Load Map when page loads
document.addEventListener("DOMContentLoaded", initMap);

// Get Coordinates using Nominatim API
async function getCoordinates(address) {
    try {
        let response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${address}`);
        let data = await response.json();
        console.log(`Coordinates for ${address}:`, data);
        return data.length ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null;
    } catch (error) {
        console.error("Error fetching coordinates:", error);
        return null;
    }
}

// Calculate Distance and Price
async function calculateDistance() {
    let startLocation = document.getElementById("start").value;
    let endLocation = document.getElementById("end").value;

    let startCoords = await getCoordinates(startLocation);
    let endCoords = await getCoordinates(endLocation);

    if (!startCoords || !endCoords) {
        alert("Invalid locations! Please enter valid addresses.");
        return;
    }

    let distance = getDistance(startCoords, endCoords);
    if (isNaN(distance) || distance <= 0) {
        alert("Error calculating distance.");
        return;
    }

    document.getElementById("distance").innerText = `Distance: ${distance.toFixed(2)} KM`;

    // Pricing Logic
    document.getElementById("olaPrice").innerText = `Price: ₹${(distance * 12).toFixed(2)}`;
    document.getElementById("uberPrice").innerText = `Price: ₹${(distance * 10).toFixed(2)}`;
    document.getElementById("rapidoPrice").innerText = `Price: ₹${(distance * 8).toFixed(2)}`;

    drawRoute(startCoords, endCoords);
}

// Haversine Formula for Distance Calculation
function getDistance(coord1, coord2) {
    let R = 6371; // Earth's radius in km
    let dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
    let dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
    let a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Draw Route on Map
async function drawRoute(startCoords, endCoords) {
    try {
        let url = `https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=full&geometries=geojson`;
        let response = await fetch(url);
        let data = await response.json();

        if (data.routes && data.routes.length > 0) {
            let route = data.routes[0].geometry;
            window.routeLayer.clearLayers();
            L.geoJSON(route, { color: 'blue' }).addTo(window.routeLayer);
            window.map.fitBounds([startCoords, endCoords]);
        } else {
            console.error("No route found:", data);
            alert("Could not find a route. Try different locations.");
        }
    } catch (error) {
        console.error("Error fetching route:", error);
        alert("Failed to fetch route. Check your network.");
    }
}
