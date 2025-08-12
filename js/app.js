// Map initialization with extent locked to Namibia
const namibiaBounds = [
    [-29.0, 11.5], // Southwest corner
    [-16.5, 25.5]  // Northeast corner
];

// Initialize the map centered on Namibia 
const map = L.map('map', {
    zoomControl: false  // Disable default zoom control
}).setView([-22.9576, 18.4904], 6); // Centered on Namibia with zoom level 7

// Base layers
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var googleStreets = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps'
});

var worldImagery = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps'
});

// Layer control 
var baseLayers = {
    "OpenStreetMap": osm,
    "Google Streets": googleStreets,
    "World Imagery": worldImagery
};

// Set the bounds for the African continent map only locked to Africa
var africaBounds = [[-35, -20], [37, 51]];  // South-west to North-east corners

// Lock map bounds to Africa
map.setMaxBounds(africaBounds);

// Disable zooming out beyond a certain zoom level
map.setMinZoom(4);

// Ensure map stays within Africa bounds on zoom or drag
map.on('drag', function() {
    map.panInsideBounds(africaBounds);
});

// Add layer control to map 
L.control.layers(baseLayers).addTo(map);

// Custom zoom controls
L.control.zoom({
    position: 'topright',
    zoomInText: '+',
    zoomOutText: '-'
}).addTo(map);

// Scale bar with custom class
L.control.scale({
    position: 'topright', 
    imperial: false
}).addTo(map).getContainer().classList.add('custom-scale');

// Zoom to Original Extent functionality
function initializeZoomExtentButton() {
    const zoomExtentButton = document.getElementById('zoom-extent-button');
    const originalView = {
        center: [-22.9576, 18.4904], // Same as your initial map view
        zoom: 6
    };

    if (zoomExtentButton) {
        zoomExtentButton.addEventListener('click', function(e) {
            e.preventDefault();
            map.setView(originalView.center, originalView.zoom);
            
            // Add a brief highlight effect
            this.style.backgroundColor = '#4aa459';
            this.querySelector('img').style.filter = 'brightness(0) invert(1)';
            
            setTimeout(() => {
                this.style.backgroundColor = 'white';
                this.querySelector('img').style.filter = '';
            }, 300);
        });
    }
}

// Initialize the button after map is loaded
if (typeof map !== 'undefined') {
    initializeZoomExtentButton();
}

/// ====== COMPLETE MEASURE CONTROL IMPLEMENTATION ======
// Enhanced Leaflet Measure Control with proper panel integration
L.Control.Measure = L.Control.extend({
    options: {
        position: 'topleft',
        primaryLengthUnit: 'kilometers',
        secondaryLengthUnit: 'meters',
        primaryAreaUnit: 'hectares',
        secondaryAreaUnit: 'sqmeters',
        activeColor: '#4a6ca4',
        completedColor: '#4aa459',
        popupOptions: {
            className: 'measure-tooltip',
            autoPanPadding: [10, 10]
        }
    },

    onAdd: function(map) {
        this._map = map;
        this._layer = new L.LayerGroup();
        map.addLayer(this._layer);
        this._measuring = false;
        this._measureType = null;
        this._measurePoints = [];
        this._measureLine = null;
        this._measurePolygon = null;
        this._measureTooltip = null;
        return L.DomUtil.create('div', 'leaflet-control-measure');
    },

    startMeasuring: function(type) {
        this._stopMeasuring();
        this._layer.clearLayers();
        this._measurePoints = [];
        this._measureType = type;
        this._measuring = true;
        this._measureLine = null;
        this._measurePolygon = null;
        this._measureTooltip = null;
        
        this._map.on('click', this._onMeasureClick, this);
        this._map.on('mousemove', this._onMeasureMove, this);
        this._map.on('dblclick', this._onMeasureDoubleClick, this);
        
        // Change cursor to crosshair
        this._map._container.style.cursor = 'crosshair';
        
        // Fire start event
        this._map.fire('measurestart', { type: type });
    },

    _stopMeasuring: function() {
        this._measuring = false;
        this._map.off('click', this._onMeasureClick, this);
        this._map.off('mousemove', this._onMeasureMove, this);
        this._map.off('dblclick', this._onMeasureDoubleClick, this);
        this._map._container.style.cursor = '';
        
        if (this._measureTooltip) {
            this._map.removeLayer(this._measureTooltip);
            this._measureTooltip = null;
        }
    },

    clearMeasurements: function() {
        this._stopMeasuring();
        this._layer.clearLayers();
        this._measurePoints = [];
        this._measureLine = null;
        this._measurePolygon = null;
        this._measureTooltip = null;
        this._map.fire('measureclear');
    },

    _onMeasureClick: function(e) {
        if (!this._measuring) return;
        
        // Prevent map click event
        L.DomEvent.stopPropagation(e);
        
        this._measurePoints.push(e.latlng);
        
        if (this._measurePoints.length === 1) {
            // First point - create initial line
            this._measureLine = L.polyline([e.latlng, e.latlng], {
                color: this.options.activeColor,
                weight: 2,
                dashArray: '5,5'
            }).addTo(this._layer);
            
            // Create tooltip
            this._measureTooltip = L.tooltip({
                permanent: true,
                direction: 'top',
                className: this.options.popupOptions.className
            }).setContent('Click to continue measuring').addTo(this._map);
            
            this._measureTooltip.setLatLng(e.latlng);
        } else {
            // Update line with new points
            this._measureLine.setLatLngs(this._measurePoints);
        }
        
        // Handle area measurement polygon
        if (this._measureType === 'area' && this._measurePoints.length >= 3) {
            if (!this._measurePolygon) {
                this._measurePolygon = L.polygon([this._measurePoints], {
                    color: this.options.activeColor,
                    weight: 2,
                    fillColor: this.options.activeColor,
                    fillOpacity: 0.2,
                    dashArray: '5,5'
                }).addTo(this._layer);
            } else {
                this._measurePolygon.setLatLngs([this._measurePoints]);
            }
        }
        
        this._updateMeasureTooltip(e.latlng);
    },

    _onMeasureMove: function(e) {
        if (!this._measuring || this._measurePoints.length === 0) return;
        
        const movingPoints = [...this._measurePoints, e.latlng];
        this._measureLine.setLatLngs(movingPoints);
        
        // Update polygon for area measurement
        if (this._measureType === 'area' && this._measurePoints.length >= 2) {
            if (!this._measurePolygon && this._measurePoints.length >= 2) {
                this._measurePolygon = L.polygon([movingPoints], {
                    color: this.options.activeColor,
                    weight: 2,
                    fillColor: this.options.activeColor,
                    fillOpacity: 0.2,
                    dashArray: '5,5'
                }).addTo(this._layer);
            } else if (this._measurePolygon) {
                this._measurePolygon.setLatLngs([movingPoints]);
            }
        }
        
        this._updateMeasureTooltip(e.latlng);
    },

    _onMeasureDoubleClick: function(e) {
        if (!this._measuring || this._measurePoints.length < 2) return;
        
        // Prevent map zoom
        L.DomEvent.stopPropagation(e);
        
        this._stopMeasuring();
        
        // Complete the measurement
        if (this._measureType === 'distance') {
            this._measureLine.setStyle({
                color: this.options.completedColor,
                dashArray: null
            });
            
            const distance = this._calculateDistance(this._measurePoints);
            const lastSegment = this._calculateDistance([
                this._measurePoints[this._measurePoints.length - 2], 
                this._measurePoints[this._measurePoints.length - 1]
            ]);
            
            // Add permanent tooltip to completed line
            const center = this._measureLine.getBounds().getCenter();
            const permanentTooltip = L.tooltip({
                permanent: true,
                direction: 'top',
                className: 'measure-tooltip completed'
            }).setContent(`Total: ${this._formatDistance(distance)}`);
            
            this._measureLine.bindTooltip(permanentTooltip);
            
            // Fire the correct event with proper data structure
            this._map.fire('measurefinish', {
                type: 'distance',
                points: this._measurePoints,
                total: distance,
                last: lastSegment,
                unit: this.options.primaryLengthUnit
            });
            
        } else if (this._measureType === 'area') {
            // Close the polygon properly
            if (this._measurePoints.length >= 3) {
                this._measureLine.setStyle({
                    color: this.options.completedColor,
                    dashArray: null
                });
                
                if (this._measurePolygon) {
                    this._measurePolygon.setStyle({
                        color: this.options.completedColor,
                        fillColor: this.options.completedColor,
                        dashArray: null
                    });
                }
                
                const area = this._calculateArea(this._measurePoints);
                const perimeter = this._calculateDistance([...this._measurePoints, this._measurePoints[0]]);
                
                // Add permanent tooltip to completed area
                const center = this._measurePolygon ? this._measurePolygon.getBounds().getCenter() : this._measureLine.getBounds().getCenter();
                const permanentTooltip = L.tooltip({
                    permanent: true,
                    direction: 'center',
                    className: 'measure-tooltip completed'
                }).setContent(`Area: ${this._formatArea(area)}`);
                
                if (this._measurePolygon) {
                    this._measurePolygon.bindTooltip(permanentTooltip);
                }
                
                // Fire the correct event with proper data structure
                this._map.fire('measurefinish', {
                    type: 'area',
                    points: this._measurePoints,
                    area: area,
                    perimeter: perimeter,
                    unit: this.options.primaryAreaUnit
                });
            }
        }
    },

    _updateMeasureTooltip: function(latlng) {
        if (!this._measureTooltip || this._measurePoints.length === 0) return;
        
        let content = 'Double-click to complete';
        
        if (this._measurePoints.length > 1) {
            if (this._measureType === 'distance') {
                const distance = this._calculateDistance(this._measurePoints);
                const lastSegment = this._calculateDistance([
                    this._measurePoints[this._measurePoints.length - 2], 
                    this._measurePoints[this._measurePoints.length - 1]
                ]);
                
                content = `Total: ${this._formatDistance(distance)}<br>Segment: ${this._formatDistance(lastSegment)}<br>${content}`;
            } else if (this._measureType === 'area' && this._measurePoints.length > 2) {
                const area = this._calculateArea(this._measurePoints);
                const perimeter = this._calculateDistance([...this._measurePoints, this._measurePoints[0]]);
                
                content = `Area: ${this._formatArea(area)}<br>Perimeter: ${this._formatDistance(perimeter)}<br>${content}`;
            }
        }
        
        this._measureTooltip.setContent(content);
        this._measureTooltip.setLatLng(latlng);
    },

    _calculateDistance: function(points) {
        let distance = 0;
        
        for (let i = 1; i < points.length; i++) {
            distance += points[i-1].distanceTo(points[i]);
        }
        
        // Convert to kilometers
        return distance / 1000;
    },

    _calculateArea: function(points) {
        if (points.length < 3) return 0;
        
        // Use Leaflet's built-in area calculation for better accuracy
        const polygon = L.polygon(points);
        const area = L.GeometryUtil.geodesicArea(polygon.getLatLngs()[0]);
        
        // Convert to hectares (area is in square meters)
        return area / 10000;
    },

    _formatDistance: function(distance) {
        if (this.options.primaryLengthUnit === 'kilometers') {
            if (distance < 1 && this.options.secondaryLengthUnit) {
                return (distance * 1000).toFixed(1) + ' m';
            }
            return distance.toFixed(2) + ' km';
        }
        return distance.toFixed(1) + ' m';
    },

    _formatArea: function(area) {
        if (this.options.primaryAreaUnit === 'hectares') {
            if (area < 1 && this.options.secondaryAreaUnit) {
                return (area * 10000).toFixed(1) + ' m²';
            }
            return area.toFixed(2) + ' ha';
        }
        return area.toFixed(1) + ' m²';
    }
});

// ====== SELECT CONTROL IMPLEMENTATION ======
L.Control.Select = L.Control.extend({
    options: {
        position: 'topleft',
        activeColor: '#4a6ca4',
        completedColor: '#4aa459',
        popupOptions: {
            className: 'select-tooltip',
            autoPanPadding: [10, 10]
        }
    },

    onAdd: function(map) {
        this._map = map;
        this._selectionLayer = new L.LayerGroup();
        map.addLayer(this._selectionLayer);
        this._selecting = false;
        this._selectType = null;
        this._selectPoints = [];
        this._selectPolygon = null;
        this._selectTooltip = null;
        this._selectedFeatures = [];
        return L.DomUtil.create('div', 'leaflet-control-select');
    },

    startSelecting: function(type) {
        this._stopSelecting();
        this._selectionLayer.clearLayers();
        this._selectPoints = [];
        this._selectType = type;
        this._selecting = true;
        this._selectPolygon = null;
        this._selectTooltip = null;
        this._selectedFeatures = [];
        
        if (type === 'polygon') {
            this._map.on('click', this._onSelectClick, this);
            this._map.on('mousemove', this._onSelectMove, this);
            this._map.on('dblclick', this._onSelectDoubleClick, this);
        } else if (type === 'point') {
            this._map.on('click', this._onPointSelect, this);
        }
        
        // Change cursor to crosshair
        this._map._container.style.cursor = 'crosshair';
        
        // Fire start event
        this._map.fire('selectstart', { type: type });
    },

    _stopSelecting: function() {
        this._selecting = false;
        this._map.off('click', this._onSelectClick, this);
        this._map.off('mousemove', this._onSelectMove, this);
        this._map.off('dblclick', this._onSelectDoubleClick, this);
        this._map.off('click', this._onPointSelect, this);
        this._map._container.style.cursor = '';
        
        if (this._selectTooltip) {
            this._map.removeLayer(this._selectTooltip);
            this._selectTooltip = null;
        }
    },

    clearSelection: function() {
        this._stopSelecting();
        this._selectionLayer.clearLayers();
        this._selectPoints = [];
        this._selectPolygon = null;
        this._selectTooltip = null;
        this._selectedFeatures = [];
        this._map.fire('selectclear');
    },

    _onSelectClick: function(e) {
        if (!this._selecting || this._selectType !== 'polygon') return;
        
        // Prevent map click event
        L.DomEvent.stopPropagation(e);
        
        this._selectPoints.push(e.latlng);
        
        if (this._selectPoints.length === 1) {
            // First point - create initial polygon
            this._selectPolygon = L.polygon([e.latlng, e.latlng], {
                color: this.options.activeColor,
                weight: 2,
                fillColor: this.options.activeColor,
                fillOpacity: 0.2,
                dashArray: '5,5'
            }).addTo(this._selectionLayer);
            
            // Create tooltip
            this._selectTooltip = L.tooltip({
                permanent: true,
                direction: 'top',
                className: this.options.popupOptions.className
            }).setContent('Click to continue selecting').addTo(this._map);
            
            this._selectTooltip.setLatLng(e.latlng);
        } else {
            // Update polygon with new points
            this._selectPolygon.setLatLngs([this._selectPoints]);
        }
        
        this._updateSelectTooltip(e.latlng);
    },

    _onSelectMove: function(e) {
        if (!this._selecting || this._selectType !== 'polygon' || this._selectPoints.length === 0) return;
        
        const movingPoints = [...this._selectPoints, e.latlng];
        this._selectPolygon.setLatLngs([movingPoints]);
        
        this._updateSelectTooltip(e.latlng);
    },

    _onSelectDoubleClick: function(e) {
        if (!this._selecting || this._selectType !== 'polygon' || this._selectPoints.length < 3) return;
        
        // Prevent map zoom
        L.DomEvent.stopPropagation(e);
        
        this._stopSelecting();
        
        // Complete the selection
        this._selectPolygon.setStyle({
            color: this.options.completedColor,
            fillColor: this.options.completedColor,
            dashArray: null
        });
        
        // Find features within the polygon
        this._findFeaturesInPolygon(this._selectPoints);
    },

    _onPointSelect: function(e) {
        if (!this._selecting || this._selectType !== 'point') return;
        
        // Prevent map click event
        L.DomEvent.stopPropagation(e);
        
        this._stopSelecting();
        
        // Create a marker at the point
        const marker = L.circleMarker(e.latlng, {
            radius: 8,
            color: this.options.completedColor,
            fillColor: this.options.completedColor,
            fillOpacity: 0.8
        }).addTo(this._selectionLayer);
        
        // Find features at the point
        this._findFeaturesAtPoint(e.latlng);
    },

    _updateSelectTooltip: function(latlng) {
        if (!this._selectTooltip || this._selectPoints.length === 0) return;
        
        let content = 'Double-click to complete selection';
        
        if (this._selectPoints.length > 1) {
            content = `Points: ${this._selectPoints.length}<br>${content}`;
        }
        
        this._selectTooltip.setContent(content);
        this._selectTooltip.setLatLng(latlng);
    },

    _findFeaturesInPolygon: function(points) {
        // Create a polygon from the points
        const polygon = L.polygon(points);
        const bounds = polygon.getBounds();
        
        // Find all active layers and check for features within the polygon
        const activeLayers = this._getActiveLayers();
        const foundFeatures = [];
        
        // For each active layer, find features within the bounds
        activeLayers.forEach(layer => {
            // In a real implementation, you would query your data source here
            // For this example, we'll simulate finding some features
            const layerName = layer.options.layers || 'Unknown Layer';
            const featureCount = Math.floor(Math.random() * 5); // Random number of features
            
            for (let i = 0; i < featureCount; i++) {
                foundFeatures.push({
                    layer: layerName,
                    feature: `Feature ${i+1}`,
                    details: `Some details about feature ${i+1}`
                });
            }
        });
        
        this._selectedFeatures = foundFeatures;
        this._map.fire('selectfinish', {
            type: 'polygon',
            points: points,
            features: foundFeatures
        });
    },

    _findFeaturesAtPoint: function(latlng) {
        // Find all active layers and check for features at the point
        const activeLayers = this._getActiveLayers();
        const foundFeatures = [];
        
        // For each active layer, find features at the point
        activeLayers.forEach(layer => {
            // In a real implementation, you would query your data source here
            // For this example, we'll simulate finding some features
            const layerName = layer.options.layers || 'Unknown Layer';
            const featureCount = Math.floor(Math.random() * 3); // Random number of features
            
            for (let i = 0; i < featureCount; i++) {
                foundFeatures.push({
                    layer: layerName,
                    feature: `Feature ${i+1}`,
                    details: `Some details about feature ${i+1}`
                });
            }
        });
        
        this._selectedFeatures = foundFeatures;
        this._map.fire('selectfinish', {
            type: 'point',
            point: latlng,
            features: foundFeatures
        });
    },

    _getActiveLayers: function() {
        // Get all active layers from the map
        const activeLayers = [];
        
        // Check geological layers
        const geologyRadio = document.querySelector('input[name="geology"]:checked');
        if (geologyRadio) {
            const layerId = geologyRadio.id;
            if (geologyLayers[layerId]) {
                activeLayers.push(geologyLayers[layerId]);
            }
        }
        
        // Check orientation layers
        document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            const layerId = checkbox.id;
            if (orientationLayers[layerId]) {
                activeLayers.push(orientationLayers[layerId]);
            }
        });
        
        return activeLayers;
    }
});

// ====== SELECT PANEL INTEGRATION ======
// Create the select control instance
const selectControl = new L.Control.Select();
selectControl.addTo(map);

// Panel button event handlers
document.getElementById('select-polygon').addEventListener('click', function() {
    // Remove active class from all buttons
    document.querySelectorAll('.select-btn').forEach(btn => btn.classList.remove('active'));
    // Add active class to clicked button
    this.classList.add('active');
    
    // Start polygon selection
    selectControl.startSelecting('polygon');
});

document.getElementById('select-point').addEventListener('click', function() {
    // Remove active class from all buttons
    document.querySelectorAll('.select-btn').forEach(btn => btn.classList.remove('active'));
    // Add active class to clicked button
    this.classList.add('active');
    
    // Start point selection
    selectControl.startSelecting('point');
});

document.getElementById('clear-selection').addEventListener('click', function() {
    // Remove active class from all buttons
    document.querySelectorAll('.select-btn').forEach(btn => btn.classList.remove('active'));
    
    // Clear all selections
    selectControl.clearSelection();
    
    // Clear the results table
    const resultsTable = document.querySelector('.results-table tbody');
    resultsTable.innerHTML = '';
    
    // Update results count
    document.querySelector('.results-count').textContent = '0 features found';
});

// ====== SELECT EVENT HANDLERS ======
// Handle selection completion
map.on('selectfinish', function(e) {
    console.log('Selection finished:', e); // Debug log
    
    const resultsTable = document.querySelector('.results-table tbody');
    resultsTable.innerHTML = '';
    
    if (e.features && e.features.length > 0) {
        // Update results count
        document.querySelector('.results-count').textContent = `${e.features.length} features found`;
        
        // Populate the table
        e.features.forEach((feature, index) => {
            const row = document.createElement('tr');
            
            const layerCell = document.createElement('td');
            layerCell.textContent = feature.layer;
            
            const featureCell = document.createElement('td');
            featureCell.textContent = feature.feature;
            
            const detailsCell = document.createElement('td');
            detailsCell.textContent = feature.details;
            
            row.appendChild(layerCell);
            row.appendChild(featureCell);
            row.appendChild(detailsCell);
            
            resultsTable.appendChild(row);
        });
    } else {
        // No features found
        document.querySelector('.results-count').textContent = '0 features found';
        
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 3;
        cell.textContent = 'No features found in selection';
        cell.style.textAlign = 'center';
        cell.style.color = '#999';
        row.appendChild(cell);
        resultsTable.appendChild(row);
    }
    
    // Remove active class from buttons after selection is complete
    document.querySelectorAll('.select-btn').forEach(btn => btn.classList.remove('active'));
});

// Handle selection start
map.on('selectstart', function(e) {
    console.log('Selection started:', e); // Debug log
    // Clear previous results when starting new selection
    const resultsTable = document.querySelector('.results-table tbody');
    resultsTable.innerHTML = '';
    document.querySelector('.results-count').textContent = '0 features found';
});

// Handle selection clear
map.on('selectclear', function(e) {
    console.log('Selection cleared:', e); // Debug log
    // Clear results table
    const resultsTable = document.querySelector('.results-table tbody');
    resultsTable.innerHTML = '';
    document.querySelector('.results-count').textContent = '0 features found';
});

// ====== MEASUREMENT PANEL INTEGRATION ======
// Create the measure control instance
const measureControl = new L.Control.Measure();
measureControl.addTo(map);

// Panel button event handlers
document.getElementById('measure-distance').addEventListener('click', function() {
    // Remove active class from all buttons
    document.querySelectorAll('.measure-btn').forEach(btn => btn.classList.remove('active'));
    // Add active class to clicked button
    this.classList.add('active');
    
    // Start distance measurement
    measureControl.startMeasuring('distance');
});

document.getElementById('measure-area').addEventListener('click', function() {
    // Remove active class from all buttons
    document.querySelectorAll('.measure-btn').forEach(btn => btn.classList.remove('active'));
    // Add active class to clicked button
    this.classList.add('active');
    
    // Start area measurement
    measureControl.startMeasuring('area');
});

document.getElementById('clear-measure').addEventListener('click', function() {
    // Remove active class from all buttons
    document.querySelectorAll('.measure-btn').forEach(btn => btn.classList.remove('active'));
    
    // Clear all measurements
    measureControl.clearMeasurements();
    
    // Reset the display results
    document.getElementById('distance-total').textContent = '0 km';
    document.getElementById('distance-segment').textContent = '0 km';
    document.getElementById('area-total').textContent = '0 ha';
    document.getElementById('perimeter-total').textContent = '0 km';
    
    // Hide result panels
    document.getElementById('distance-result').style.display = 'none';
    document.getElementById('area-result').style.display = 'none';
});

// ====== MEASUREMENT EVENT HANDLERS ======
// Handle measurement completion
map.on('measurefinish', function(e) {
    console.log('Measurement finished:', e); // Debug log
    
    if (e.type === 'distance') {
        // Show distance results panel
        document.getElementById('distance-result').style.display = 'block';
        document.getElementById('area-result').style.display = 'none';
        
        // Update distance values
        document.getElementById('distance-total').textContent = formatDistance(e.total);
        document.getElementById('distance-segment').textContent = formatDistance(e.last);
    } else if (e.type === 'area') {
        // Show area results panel
        document.getElementById('area-result').style.display = 'block';
        document.getElementById('distance-result').style.display = 'none';
        
        // Update area values
        document.getElementById('area-total').textContent = formatArea(e.area);
        document.getElementById('perimeter-total').textContent = formatDistance(e.perimeter);
    }
    
    // Remove active class from buttons after measurement is complete
    document.querySelectorAll('.measure-btn').forEach(btn => btn.classList.remove('active'));
});

// Handle measurement start
map.on('measurestart', function(e) {
    console.log('Measurement started:', e); // Debug log
    // Clear previous results when starting new measurement
    document.getElementById('distance-result').style.display = 'none';
    document.getElementById('area-result').style.display = 'none';
});

// Handle measurement clear
map.on('measureclear', function(e) {
    console.log('Measurement cleared:', e); // Debug log
    // Hide result panels and reset values
    document.getElementById('distance-result').style.display = 'none';
    document.getElementById('area-result').style.display = 'none';
    document.getElementById('distance-total').textContent = '0 km';
    document.getElementById('distance-segment').textContent = '0 km';
    document.getElementById('area-total').textContent = '0 ha';
    document.getElementById('perimeter-total').textContent = '0 km';
});

// ====== ATTRIBUTE TABLE FUNCTIONALITY ======
// Function to query GeoServer and populate attribute table
function queryAttributeTable(layerName) {
    // Clear existing results
    const tableBody = document.querySelector('#attribute-data-table tbody');
    tableBody.innerHTML = '';
    document.querySelector('.results-count').textContent = 'Loading...';
    
    // Determine the WFS URL based on layer name
    let wfsUrl;
    let featureType;
    
    switch(layerName) {
        case 'geology_1m':
            wfsUrl = 'http://localhost:8081/geoserver/nam_geology/wfs';
            featureType = 'nam_geology_app:geology_1m';
            break;
        case 'geology_age':
            wfsUrl = 'http://localhost:8081/geoserver/namibia/wfs';
            featureType = 'namibia:geology_age';
            break;
        case 'dominant_rock_types':
            wfsUrl = 'http://localhost:8081/geoserver/namibia/wfs';
            featureType = 'namibia:dominant_rock_types';
            break;
        case 'minerals':
            wfsUrl = 'http://localhost:8081/geoserver/nam_geology/wfs';
            featureType = 'nam_geology_app:minerals';
            break;
        case 'towns_villages':
            wfsUrl = 'http://localhost:8081/geoserver/nam_geology/wfs';
            featureType = 'nam_geology_app:towns_villages';
            break;
        case 'national_monuments':
            wfsUrl = 'http://localhost:8081/geoserver/namibia/wfs';
            featureType = 'namibia:national_monuments';
            break;
        case 'geotourism_sites':
            wfsUrl = 'http://localhost:8081/geoserver/namibia/wfs';
            featureType = 'namibia:geotourism_sites';
            break;
        case 'main_roads':
            wfsUrl = 'http://localhost:8081/geoserver/nam_geology/wfs';
            featureType = 'nam_geology_app:main_roads';
            break;
        case 'protected_areas':
            wfsUrl = 'http://localhost:8081/geoserver/nam_geology/wfs';
            featureType = 'nam_geology_app:protected_areas';
            break;
        case 'nam_boundaries':
            wfsUrl = 'http://localhost:8081/geoserver/nam_geology/wfs';
            featureType = 'nam_geology_app:regions';
            break;
        default:
            console.error('Unknown layer:', layerName);
            document.querySelector('.results-count').textContent = 'Error: Unknown layer';
            return;
    }
    
    // Construct WFS request URL
    const requestUrl = `${wfsUrl}?service=WFS&version=1.1.0&request=GetFeature&typeName=${featureType}&outputFormat=application/json&srsName=EPSG:4326&maxFeatures=100`;
    
    // Fetch data from GeoServer
    fetch(requestUrl)
        .then(response => response.json())
        .then(data => {
            if (data.features && data.features.length > 0) {
                // Update results count
                document.querySelector('.results-count').textContent = `${data.features.length} records found`;
                
                // Populate the table
                data.features.forEach((feature, index) => {
                    const row = document.createElement('tr');
                    
                    // Layer name cell
                    const layerCell = document.createElement('td');
                    layerCell.textContent = layerName.replace(/_/g, ' ');
                    row.appendChild(layerCell);
                    
                    // Feature name/ID cell
                    const featureCell = document.createElement('td');
                    featureCell.textContent = feature.id || `Feature ${index + 1}`;
                    row.appendChild(featureCell);
                    
                    // Type cell (extract from properties)
                    const typeCell = document.createElement('td');
                    const typeProperty = feature.properties.type || 
                                       feature.properties.rock_type || 
                                       feature.properties.geology_type || 
                                       feature.properties.category || 
                                       'N/A';
                    typeCell.textContent = typeProperty;
                    row.appendChild(typeCell);
                    
                    // Location cell (extract coordinates if available)
                    const locationCell = document.createElement('td');
                    if (feature.geometry && feature.geometry.coordinates) {
                        const coords = feature.geometry.coordinates;
                        if (feature.geometry.type === 'Point') {
                            locationCell.textContent = `Lat: ${coords[1].toFixed(4)}, Lon: ${coords[0].toFixed(4)}`;
                        } else {
                            locationCell.textContent = 'Multiple coordinates';
                        }
                    } else {
                        locationCell.textContent = 'N/A';
                    }
                    row.appendChild(locationCell);
                    
                    tableBody.appendChild(row);
                });
            } else {
                // No features found
                document.querySelector('.results-count').textContent = '0 records found';
                
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 4;
                cell.textContent = 'No records found for this layer';
                cell.style.textAlign = 'center';
                cell.style.color = '#999';
                row.appendChild(cell);
                tableBody.appendChild(row);
            }
        })
        .catch(error => {
            console.error('Error fetching WFS data:', error);
            document.querySelector('.results-count').textContent = 'Error loading data';
            
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 4;
            cell.textContent = 'Error loading data from server';
            cell.style.textAlign = 'center';
            cell.style.color = '#d32f2f';
            row.appendChild(cell);
            tableBody.appendChild(row);
        });
}

// Function to get currently active layer name
function getActiveLayerName() {
    // Check geological layers
    const geologyRadio = document.querySelector('input[name="geology"]:checked');
    if (geologyRadio) {
        return geologyRadio.id.replace(/-/g, '_');
    }
    
    // Check orientation layers
    const orientationCheckbox = document.querySelector('input[type="checkbox"]:checked');
    if (orientationCheckbox) {
        return orientationCheckbox.id.replace(/-/g, '_');
    }
    
    return null;
}

// Event listener for attribute table panel button
document.querySelector('.panel-btn[data-panel="attribute-table"]').addEventListener('click', function() {
    const activeLayer = getActiveLayerName();
    if (activeLayer) {
        queryAttributeTable(activeLayer);
    } else {
        const tableBody = document.querySelector('#attribute-data-table tbody');
        tableBody.innerHTML = '';
        
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 4;
        cell.textContent = 'Please activate a layer first';
        cell.style.textAlign = 'center';
        cell.style.color = '#999';
        row.appendChild(cell);
        tableBody.appendChild(row);
        
        document.querySelector('.results-count').textContent = 'No active layer';
    }
});

// Event listener for attribute search
document.getElementById('attribute-search-icon').addEventListener('click', function() {
    const searchTerm = document.getElementById('attribute-search-input').value.trim();
    if (searchTerm) {
        filterAttributeTable(searchTerm);
    }
});

document.getElementById('attribute-search-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const searchTerm = document.getElementById('attribute-search-input').value.trim();
        if (searchTerm) {
            filterAttributeTable(searchTerm);
        }
    }
});

// Function to filter attribute table
function filterAttributeTable(searchTerm) {
    const tableBody = document.querySelector('#attribute-data-table tbody');
    const rows = tableBody.querySelectorAll('tr');
    let matchCount = 0;
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let rowMatches = false;
        
        cells.forEach(cell => {
            if (cell.textContent.toLowerCase().includes(searchTerm.toLowerCase())) {
                rowMatches = true;
            }
        });
        
        if (rowMatches) {
            row.style.display = '';
            matchCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    document.querySelector('.results-count').textContent = `${matchCount} records match "${searchTerm}"`;
}

// ====== HELPER FUNCTIONS ======
function formatDistance(distance) {
    if (distance < 1) {
        return (distance * 1000).toFixed(1) + ' m';
    }
    return distance.toFixed(2) + ' km';
}

function formatArea(area) {
    if (area < 1) {
        return (area * 10000).toFixed(1) + ' m²';
    }
    return area.toFixed(2) + ' ha';
}

// ====== LEAFLET GEOMETRY UTILITIES ======
// Add geometry utilities if not already present
if (!L.GeometryUtil) {
    L.GeometryUtil = {};
    
    L.GeometryUtil.geodesicArea = function(latLngs) {
        var pointsCount = latLngs.length,
            area = 0.0,
            d2r = Math.PI / 180,
            p1, p2;

        if (pointsCount > 2) {
            for (var i = 0; i < pointsCount; i++) {
                p1 = latLngs[i];
                p2 = latLngs[(i + 1) % pointsCount];
                area += ((p2.lng - p1.lng) * d2r) *
                        (2 + Math.sin(p1.lat * d2r) + Math.sin(p2.lat * d2r));
            }
            area = area * 6378137.0 * 6378137.0 / 2.0;
        }

        return Math.abs(area);
    };
}

// Show coordinates 
var coordinatesDiv = document.getElementById('coordinates');
map.on('mousemove', function(e) {
    coordinatesDiv.innerHTML = `Lat: ${e.latlng.lat.toFixed(4)}, Lon: ${e.latlng.lng.toFixed(4)}`;
});

// Geological WMS layers from GeoServer
const geologyLayers = {
    "major-geological-units": L.tileLayer.wms("http://localhost:8081/geoserver/wms", {
        layers: "nam_geology_app:geology_1m",
        format: "image/png",
        transparent: true,
        attribution: "Geological Survey of Namibia"
    }),
    "geology-age": L.tileLayer.wms("http://localhost:8081/geoserver/wms", {
        layers: "namibia:geology_age",
        format: "image/png",
        transparent: true,
        attribution: "Geological Survey of Namibia"
    }),
    "dominant-rock-types": L.tileLayer.wms("http://localhost:8081/geoserver/wms", {
        layers: "namibia:dominant_rock_types",
        format: "image/png",
        transparent: true,
        attribution: "Geological Survey of Namibia"
    }),
    "minerals": L.tileLayer.wms("http://localhost:8081/geoserver/wms", {
        layers: "nam_geology_app:minerals",
        format: "image/png",
        transparent: true,
        attribution: "Geological Survey of Namibia"
    })
};

// Reference/orientation WMS layers from GeoServer
const orientationLayers = {
    "towns-villages": L.tileLayer.wms("http://localhost:8081/geoserver/wms", {
        layers: "nam_geology_app:towns_villages",
        format: "image/png",
        transparent: true,
        attribution: "Geological Survey of Namibia"
    }),
    "national-monuments": L.tileLayer.wms("http://localhost:8081/geoserver/wms", {
        layers: "namibia:national_monuments",
        format: "image/png",
        transparent: true,
        attribution: "Geological Survey of Namibia"
    }),
    "geotourism-sites": L.tileLayer.wms("http://localhost:8081/geoserver/wms", {
        layers: "namibia:geotourism_sites",
        format: "image/png",
        transparent: true,
        attribution: "Geological Survey of Namibia"
    }),
    "national-roads": L.tileLayer.wms("http://localhost:8081/geoserver/wms", {
        layers: "nam_geology_app:main_roads",
        format: "image/png",
        transparent: true,
        attribution: "Geological Survey of Namibia"
    }),
    "protected-areas": L.tileLayer.wms("http://localhost:8081/geoserver/wms", {
        layers: "nam_geology_app:protected_areas",
        format: "image/png",   
        transparent: true,
        attribution: "Geological Survey of Namibia"
    }),
    "regional-boundaries": L.tileLayer.wms("http://localhost:8081/geoserver/wms", {
        layers: "nam_geology_app:regions",
        format: "image/png",
        transparent: true,
        attribution: "Geological Survey of Namibia"
    })
};

// Panel switching functionality
function setupPanelSwitching() {
    const panelButtons = document.querySelectorAll('.panel-btn');
    
    panelButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            panelButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Hide all panels
            document.querySelectorAll('.panel-view').forEach(panel => {
                panel.style.display = 'none';
            });
            
            // Show the selected panel
            const panelId = this.getAttribute('data-panel') + '-panel';
            document.getElementById(panelId).style.display = 'block';
        });
    });
}

// Sidebar section toggle functionality
function toggleSection(headerId, contentId) {
    const header = document.getElementById(headerId);
    const content = document.getElementById(contentId);
    const button = header.querySelector(".toggle-button");

    header.addEventListener("click", () => {
        if (content.style.display === "none" || content.style.display === "") {
            content.style.display = "block";
            button.innerHTML = "v";
        } else {
            content.style.display = "none";
            button.innerHTML = ">";
        }
    });
}

// Initialize sidebar toggles
toggleSection("layers-header", "layers-content");
toggleSection("legend-header", "legend-content");

// Search functionality for Namibian locations
const searchInput = document.getElementById("search-input");
const searchIcon = document.querySelector(".search-icon");
const searchResults = document.getElementById("search-results");

// Simple search function 
function performSearch() {
    var query = document.getElementById('search-input').value;
    if (!query) return;
    
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                var lat = parseFloat(data[0].lat);
                var lon = parseFloat(data[0].lon);
                map.setView([lat, lon], 10);
            } else {
                alert('Location not found');
            }
        });
}

// Search event listeners
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

searchIcon.addEventListener('click', performSearch);

// Geology layer radio button event handlers
document.getElementById("major-geological-units").addEventListener("change", () => {
    if (document.getElementById("major-geological-units").checked) {
        map.removeLayer(geologyLayers["geology-age"]);
        map.removeLayer(geologyLayers["dominant-rock-types"]);
        map.removeLayer(geologyLayers["minerals"]);
        map.addLayer(geologyLayers["major-geological-units"]);
        updateLegend("MajorGeologicalUnits");
    }
});

document.getElementById("geology-age").addEventListener("change", () => {
    if (document.getElementById("geology-age").checked) {
        map.removeLayer(geologyLayers["major-geological-units"]);
        map.removeLayer(geologyLayers["dominant-rock-types"]);
        map.removeLayer(geologyLayers["minerals"]);
        map.addLayer(geologyLayers["geology-age"]);
        updateLegend("GeologyAge");
    }
});

document.getElementById("dominant-rock-types").addEventListener("change", () => {
    if (document.getElementById("dominant-rock-types").checked) {
        map.removeLayer(geologyLayers["major-geological-units"]);
        map.removeLayer(geologyLayers["geology-age"]);
        map.removeLayer(geologyLayers["minerals"]);
        map.addLayer(geologyLayers["dominant-rock-types"]);
        updateLegend("DominantRockTypes");
    }
});

document.getElementById("minerals").addEventListener("change", () => {
    if (document.getElementById("minerals").checked) {
        map.removeLayer(geologyLayers["major-geological-units"]);
        map.removeLayer(geologyLayers["geology-age"]);
        map.removeLayer(geologyLayers["dominant-rock-types"]);
        map.addLayer(geologyLayers["minerals"]);
        updateLegend("Minerals");
    }
});

// Orientation layer checkbox event handlers
document.getElementById("towns-villages").addEventListener("change", () => {
    if (document.getElementById("towns-villages").checked) {
        map.addLayer(orientationLayers["towns-villages"]);
    } else {
        map.removeLayer(orientationLayers["towns-villages"]);
    }
});

document.getElementById("national-monuments").addEventListener("change", () => {
    if (document.getElementById("national-monuments").checked) {
        map.addLayer(orientationLayers["national-monuments"]);
    } else {
        map.removeLayer(orientationLayers["national-monuments"]);
    }
});

document.getElementById("geotourism-sites").addEventListener("change", () => {
    if (document.getElementById("geotourism-sites").checked) {
        map.addLayer(orientationLayers["geotourism-sites"]);
    } else {
        map.removeLayer(orientationLayers["geotourism-sites"]);
    }
});

document.getElementById("national-roads").addEventListener("change", () => {
    if (document.getElementById("national-roads").checked) {
        map.addLayer(orientationLayers["national-roads"]);
    } else {
        map.removeLayer(orientationLayers["national-roads"]);
    }
});

document.getElementById("protected-areas").addEventListener("change", () => {
    if (document.getElementById("protected-areas").checked) {
        map.addLayer(orientationLayers["protected-areas"]);
    } else {
        map.removeLayer(orientationLayers["protected-areas"]);
    }
});

document.getElementById("regional-boundaries").addEventListener("change", () => {
    if (document.getElementById("regional-boundaries").checked) {
        map.addLayer(orientationLayers["regional-boundaries"]);
    } else {
        map.removeLayer(orientationLayers["regional-boundaries"]);
    }
});

// Dynamic legend update based on active geological layer
function updateLegend(layerType) {
    const legendContainer = document.querySelector(".map-legend");
    
    // Clear existing legend content
    
       if (layerType === "GeologyAge") {
        legendContainer.innerHTML = `
            <div style="margin-bottom: 10px;">
                <div style="font-weight: bold;">Geology Age</div>
            </div>
        `;
       
       
    } else if (layerType === "DominantRockTypes") {
        legendContainer.innerHTML = `
            <div style="margin-bottom: 10px;">
                <div style="font-weight: bold;">Dominant Rock Types</div>
            </div>
        `;
        
    } else if (layerType === "Minerals") {
        legendContainer.innerHTML = `
            <div style="margin-bottom: 10px;">
                <div style="font-weight: bold;">Types of Minerals</div>
            </div>
        `;
    }    
}

// Set initial legend
updateLegend("MajorGeologicalUnits");

// Disclaimer modal functionality
function initializeDisclaimerModal() {
    const disclaimerModal = document.getElementById("disclaimer-modal");
    const disclaimerClose = document.getElementById("disclaimer-close");
    const disclaimerCloseBtn = document.getElementById("disclaimer-close-btn");

    // Function to close the modal
    function closeModal() {
        disclaimerModal.style.display = "none";
    }

    // Close modal event handlers
    if (disclaimerClose) {
        disclaimerClose.addEventListener("click", closeModal);
    }

    if (disclaimerCloseBtn) {
        disclaimerCloseBtn.addEventListener("click", closeModal);
    }

    // Close modal when clicking outside of it
    disclaimerModal.addEventListener("click", (e) => {
        if (e.target === disclaimerModal) {
            closeModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && disclaimerModal.style.display === "flex") {
            closeModal();
        }
    });

    // Show disclaimer on page load
    disclaimerModal.style.display = "flex";
}

// Initialize panel switching
setupPanelSwitching();

// Initialize the measure panel functionality
function initializeMeasurePanel() {
    const measureDistanceBtn = document.getElementById('measure-distance');
    const measureAreaBtn = document.getElementById('measure-area');
    const clearMeasureBtn = document.getElementById('clear-measure');
    const distanceResult = document.getElementById('distance-result');
    const areaResult = document.getElementById('area-result');
    
    let currentMeasureType = null;
    
    // Function to format measurement results
    function formatMeasurement(value, unit) {
        if (unit === 'kilometers') {
            return `${value.toFixed(2)} km`;
        } else if (unit === 'meters') {
            return `${value.toFixed(1)} m`;
        } else if (unit === 'hectares') {
            return `${value.toFixed(2)} ha`;
        } else if (unit === 'sqmeters') {
            return `${value.toFixed(1)} m²`;
        }
        return value;
    }
    
    // Function to update measurement results in panel
    function updateMeasureResults(measurement) {
        if (measurement.type === 'line') {
            distanceResult.style.display = 'block';
            areaResult.style.display = 'none';
            
            document.getElementById('distance-total').textContent = 
                formatMeasurement(measurement.total, measurement.unit);
            document.getElementById('distance-segment').textContent = 
                formatMeasurement(measurement.last, measurement.unit);
        } else if (measurement.type === 'area') {
            distanceResult.style.display = 'none';
            areaResult.style.display = 'block';
            
            document.getElementById('area-total').textContent = 
                formatMeasurement(measurement.area, measurement.unit);
            document.getElementById('perimeter-total').textContent = 
                formatMeasurement(measurement.perimeter, 'meters');
        }
    }
    
    // Function to clear measurements
    function clearMeasurements() {
        measureControl._layer.clearLayers();
        document.getElementById('distance-total').textContent = '0 km';
        document.getElementById('distance-segment').textContent = '0 km';
        document.getElementById('area-total').textContent = '0 ha';
        document.getElementById('perimeter-total').textContent = '0 km';
        measureDistanceBtn.classList.remove('active');
        measureAreaBtn.classList.remove('active');
        currentMeasureType = null;
        map._container.style.cursor = '';
    }
    
    // Distance measurement button
    measureDistanceBtn.addEventListener('click', function() {
        if (currentMeasureType === 'distance') {
            clearMeasurements();
            return;
        }
        
        clearMeasurements();
        currentMeasureType = 'distance';
        measureDistanceBtn.classList.add('active');
        
        measureControl._map = map;
        measureControl._startMeasuring();
        measureControl._measuring = true;
        measureControl._measureType = 'distance';
        
        // Update cursor
        map._container.style.cursor = 'crosshair';
    });
    
    // Area measurement button
    measureAreaBtn.addEventListener('click', function() {
        if (currentMeasureType === 'area') {
            clearMeasurements();
            return;
        }
        
        clearMeasurements();
        currentMeasureType = 'area';
        measureAreaBtn.classList.add('active');
        
        measureControl._map = map;
        measureControl._startMeasuring();
        measureControl._measuring = true;
        measureControl._measureType = 'area';
        
        // Update cursor
        map._container.style.cursor = 'crosshair';
    });
    
    // Clear measurements button
    clearMeasureBtn.addEventListener('click', clearMeasurements);
    
    // Listen for measurement events
    map.on('measurestart', function(e) {
        // Reset cursor
        map._container.style.cursor = 'crosshair';
    });
    
    map.on('measurefinish', function(e) {
        // Update results in panel
        updateMeasureResults(e);
        
        // Deactivate buttons
        measureDistanceBtn.classList.remove('active');
        measureAreaBtn.classList.remove('active');
        currentMeasureType = null;
    });
    
    map.on('measure', function(e) {
        // Update results during measurement
        updateMeasureResults(e);
    });
}

// AI Chat functionality
function initializeAIChat() {
    const aiButton = document.getElementById("ai-button");
    const aiModal = document.getElementById("ai-modal");
    const aiClose = document.getElementById("ai-close");
    const aiInput = document.getElementById("ai-input");
    const aiSend = document.getElementById("ai-send");
    const aiChat = document.getElementById("ai-chat");

    // Function to add a message to the chat
    function addMessage(text, isQuestion) {
        const messageDiv = document.createElement("div");
        messageDiv.className = isQuestion ? "ai-message ai-question" : "ai-message ai-response";
        
        const messageText = document.createElement("p");
        messageText.textContent = text;
        
        messageDiv.appendChild(messageText);
        aiChat.appendChild(messageDiv);
        
        // Scroll to bottom
        aiChat.scrollTop = aiChat.scrollHeight;
    }

    // Function to handle AI response
    function getAIResponse(question) {
        const responses = {
            "geology": "Namibia has diverse geology including Precambrian basement rocks, extensive sedimentary basins, and unique mineral deposits.",
            "rock types": "Common rock types in Namibia include granite, basalt, sandstone, and limestone, with valuable mineral deposits like diamonds and uranium.",
            "app": "This map shows geological data from the Geological Survey of Namibia. You can toggle different layers using the controls on the left.",
            "help": "I can answer questions about Namibia's geology, rock types, and this map interface. Try asking about specific regions or geological features.",
            "default": "I'm a geology assistant focused on Namibia. Could you clarify or ask about something more specific?"
        };

        const lowerQuestion = question.toLowerCase();
        let response = responses.default;

        if (lowerQuestion.includes("geology")) {
            response = responses.geology;
        } else if (lowerQuestion.includes("rock") || lowerQuestion.includes("mineral")) {
            response = responses["rock types"];
        } else if (lowerQuestion.includes("app") || lowerQuestion.includes("layer")) {
            response = responses.app;
        } else if (lowerQuestion.includes("help")) {
            response = responses.help;
        }

        // Simulate typing delay
        setTimeout(() => {
            addMessage(response, false);
        }, 1000);
    }

    // Event listeners
    aiButton.addEventListener("click", () => {
        aiModal.style.display = "flex";
    });

    aiClose.addEventListener("click", () => {
        aiModal.style.display = "none";
    });

    aiModal.addEventListener("click", (e) => {
        if (e.target === aiModal) {
            aiModal.style.display = "none";
        }
    });

    aiSend.addEventListener("click", () => {
        const question = aiInput.value.trim();
        if (question) {
            addMessage(question, true);
            aiInput.value = "";
            getAIResponse(question);
        }
    });

    aiInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const question = aiInput.value.trim();
            if (question) {
                addMessage(question, true);
                aiInput.value = "";
                getAIResponse(question);
            }
        }
    });
}

// App title fade functionality
let titleTimeout;
const appTitle = document.getElementById('app-title');

// Function to hide title
function hideTitle() {
    if (appTitle) {
        appTitle.classList.add('hidden');
    }
}

// Function to show title
function showTitle() {
    if (appTitle) {
        appTitle.classList.remove('hidden');
        clearTimeout(titleTimeout);
        titleTimeout = setTimeout(hideTitle, 9000);
    }
}

// Add zoom event listeners
if (typeof map !== 'undefined') {
    map.on('zoomstart', hideTitle);
    map.on('zoomend', showTitle);
}

// Initialize title display
showTitle();

// Find My Location functionality
let currentLocationMarker = null;
let currentAccuracyCircle = null;
let locationButton = null;

// Function to initialize location button
function initializeLocationButton() {
    locationButton = document.getElementById('location-button');
    
    if (locationButton) {
        locationButton.addEventListener('click', function(e) {
            e.preventDefault();
            findMyLocation();
        });
    }
}



// Identify Feature functionality
let identifyControl = {
    active: false,
    identifyMarker: null,
    
    init: function() {
        const identifyButton = document.getElementById('identify-button');
        
        if (identifyButton) {
            identifyButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleIdentify();
            });
        }
        
        // Add these event listeners to handle cursor changes
        map.on('mouseout', this.resetCursor, this);
        map.on('mouseover', this.setIdentifyCursor, this);
    },
    
    toggleIdentify: function() {
    const identifyButton = document.getElementById('identify-button');
    
    if (this.active) {
        // Deactivate identify
        this.active = false;
        identifyButton.classList.remove('active');
        map.getContainer().classList.remove('leaflet-identify');
        
        // Reset cursor
        this.resetCursor();
        
        // Remove any existing marker
        if (this.identifyMarker) {
            map.removeLayer(this.identifyMarker);
            this.identifyMarker = null;
        }
        
        // Hide results panel
        document.getElementById('identify-results').style.display = 'none';
        
        // Remove event listeners
        map.off('click', this.handleMapClick);
    } else {
        // Activate identify
        this.active = true;
        identifyButton.classList.add('active');
        map.getContainer().classList.add('leaflet-identify');
        
        // Set initial cursor
        this.setIdentifyCursor();
        
        // Add event listener for map clicks
        map.on('click', this.handleMapClick, this);
    }
  },
    
    setIdentifyCursor: function() {
    if (this.active) {
        // Set cursor for the map container and all interactive elements
        const elements = [map.getContainer(), ...document.querySelectorAll('.leaflet-interactive')];
        elements.forEach(el => {
            el.style.cursor = "url('Icons/idcursor.png') 16 16, crosshair";
        });
    }
},
    
    resetCursor: function() {
    if (!this.active) {
        // Reset cursor for the map container and all interactive elements
        const elements = [map.getContainer(), ...document.querySelectorAll('.leaflet-interactive')];
        elements.forEach(el => {
            el.style.cursor = "";
        });
    }
},

    
    // [Rest of the identifyControl methods remain the same]
    handleMapClick: function(e) {
        // Remove any existing marker
        if (this.identifyMarker) {
            map.removeLayer(this.identifyMarker);
        }
        
        // Add marker at clicked location
        this.identifyMarker = L.circleMarker(e.latlng, {
            radius: 8,
            color: '#4a6ca4',
            fillColor: '#4aa459',
            fillOpacity: 0.8,
            weight: 2
        }).addTo(map);
        
        // Identify features at this location
        this.identifyFeatures(e.latlng);
    },
    
    identifyFeatures: function(latlng) {
        const resultsContainer = document.getElementById('identify-results');
        const resultsContent = document.querySelector('.identify-results-container');
        
        // Clear previous results
        resultsContent.innerHTML = '';
        
        // Get all active layers
        const activeLayers = this.getActiveLayers();
        
        // Simulate finding features (in a real app, you would query your data source)
        const foundFeatures = [];
        
        activeLayers.forEach(layer => {
            // Simulate finding 1-3 features per layer
            const featureCount = Math.floor(Math.random() * 3) + 1;
            
            for (let i = 0; i < featureCount; i++) {
                foundFeatures.push({
                    layer: layer.options.layers || 'Unknown Layer',
                    name: `Feature ${i+1}`,
                    details: `Some details about this feature at (${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)})`
                });
            }
        });
        
        // Update results count
        document.querySelector('.identify-results-count').textContent = `${foundFeatures.length} features found`;
        
        // Populate results
        if (foundFeatures.length > 0) {
            foundFeatures.forEach(feature => {
                const featureDiv = document.createElement('div');
                featureDiv.className = 'identify-result-item';
                
                featureDiv.innerHTML = `
                    <div class="identify-layer-name">${feature.layer}</div>
                    <div class="identify-feature-name">${feature.name}</div>
                    <div class="identify-feature-details">${feature.details}</div>
                `;
                
                resultsContent.appendChild(featureDiv);
            });
        } else {
            const noResultsDiv = document.createElement('div');
            noResultsDiv.className = 'identify-result-item';
            noResultsDiv.textContent = 'No features found at this location';
            noResultsDiv.style.color = '#999';
            noResultsDiv.style.textAlign = 'center';
            resultsContent.appendChild(noResultsDiv);
        }
        
        // Show results panel
        resultsContainer.style.display = 'block';
    },
    
    getActiveLayers: function() {
        // Get all active layers from the map
        const activeLayers = [];
        
        // Check geological layers
        const geologyRadio = document.querySelector('input[name="geology"]:checked');
        if (geologyRadio) {
            const layerId = geologyRadio.id.replace(/-/g, '_');
            if (geologyLayers[layerId]) {
                activeLayers.push(geologyLayers[layerId]);
            }
        }
        
        // Check orientation layers
        document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            const layerId = checkbox.id.replace(/-/g, '_');
            if (orientationLayers[layerId]) {
                activeLayers.push(orientationLayers[layerId]);
            }
        });
        
        return activeLayers;
    }
};

// Initialize identify control
identifyControl.init();

// [Rest of your existing code remains the same]

// Function to find user's current location
function findMyLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by this browser.');
        return;
    }
    
    // Add loading state
    locationButton.classList.add('locating');
    locationButton.classList.remove('located', 'error');
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            
            // Remove any existing location marker and accuracy circle
            if (currentLocationMarker) {
                map.removeLayer(currentLocationMarker);
            }
            if (currentAccuracyCircle) {
                map.removeLayer(currentAccuracyCircle);
            }
            
            // Create location marker
            const locationIcon = L.icon({
                iconUrl: 'Icons/location_icon.png',
                iconSize: [40, 60],
                iconAnchor: [10, 10],
                popupAnchor: [0, -10]
            });
            
            currentLocationMarker = L.marker([lat, lng], {
                icon: locationIcon,
                title: 'Your Location'
            }).addTo(map);
            
            // Add accuracy circle
            currentAccuracyCircle = L.circle([lat, lng], {
                radius: 400,
                color: '#4aa459',
                fillColor: '#4aa459',
                fillOpacity: 0.2,
                weight: 2,
                opacity: 0.8
            }).addTo(map);
            
            // Zoom to location
            map.setView([lat, lng], 16);
            
            // Update button state
            locationButton.classList.remove('locating');
            locationButton.classList.add('located');
            
            // Show success message briefly
            const originalTitle = locationButton.querySelector('a').title;
            locationButton.querySelector('a').title = 'Location found!';
            setTimeout(() => {
                locationButton.querySelector('a').title = originalTitle;
            }, 2000);
        },
        function(error) {
            locationButton.classList.remove('locating');
            locationButton.classList.add('error');
            
            let errorMessage = 'Unable to retrieve your location.';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location access denied by user.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information is unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out.';
                    break;
            }
            
            alert(errorMessage);
            
            // Reset button state after 3 seconds
            setTimeout(() => {
                locationButton.classList.remove('error');
            }, 3000);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        }
    );
}






































// Add this to your app.js, preferably near the initialization functions

function initializeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const panelButtons = document.querySelectorAll('.panel-btn[data-panel]');
    
    // Function to toggle sidebar
    function toggleSidebar(show) {
        if (show) {
            sidebar.classList.add('expanded');
        } else {
            sidebar.classList.remove('expanded');
        }
    }
    
    // Toggle sidebar when panel buttons are clicked (mobile only)
    panelButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                toggleSidebar(true);
            }
        });
    });
    
    // Close sidebar when clicking overlay
    if (overlay) {
        overlay.addEventListener('click', function() {
            toggleSidebar(false);
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 768 && sidebar.classList.contains('expanded')) {
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnPanelButton = Array.from(panelButtons).some(btn => btn.contains(event.target));
            
            if (!isClickInsideSidebar && !isClickOnPanelButton) {
                toggleSidebar(false);
            }
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            toggleSidebar(true); // Always show sidebar on larger screens
        }
    });
}

// Call this in your DOMContentLoaded event
document.addEventListener("DOMContentLoaded", () => {
    initializeDisclaimerModal();
    initializeAIChat();
    initializeMobileSidebar(); // Add this line
});


























// Update this function in app.js
function setupPanelSwitching() {
    const panelButtons = document.querySelectorAll('.panel-btn[data-panel]');
    
    panelButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            panelButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Hide all panels
            document.querySelectorAll('.panel-view').forEach(panel => {
                panel.style.display = 'none';
            });
            
            // Show the selected panel
            const panelId = this.getAttribute('data-panel') + '-panel';
            document.getElementById(panelId).style.display = 'block';
            
            // On mobile, ensure panel content is scrolled to top
            if (window.innerWidth <= 768) {
                const panelContent = document.getElementById('panel-content');
                if (panelContent) {
                    panelContent.scrollTop = 0;
                }
            }
        });
    });
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}

// Show install prompt for PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show your custom install button (optional)
  showInstallPromotion();
});

function showInstallPromotion() {
  // You can create a custom install button here
  const installButton = document.createElement('div');
  installButton.id = 'install-button';
  installButton.innerHTML = '📲 Install App';
  installButton.style.position = 'fixed';
  installButton.style.bottom = '20px';
  installButton.style.right = '20px';
  installButton.style.padding = '10px 15px';
  installButton.style.backgroundColor = '#4aa459';
  installButton.style.color = 'white';
  installButton.style.borderRadius = '5px';
  installButton.style.cursor = 'pointer';
  installButton.style.zIndex = '10000';
  
  installButton.addEventListener('click', () => {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted install prompt');
      } else {
        console.log('User dismissed install prompt');
      }
      deferredPrompt = null;
    });
  });
  
  document.body.appendChild(installButton);
}












// Initialize location button after map is loaded
if (typeof map !== 'undefined') {
    initializeLocationButton();
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    initializeDisclaimerModal();
    initializeAIChat();
});

// Fallback for window load event
window.addEventListener("load", () => {
    const disclaimerModal = document.getElementById("disclaimer-modal");
    if (disclaimerModal && disclaimerModal.style.display !== "flex") {
        initializeDisclaimerModal();
    }
    
    if (typeof initializeAIChat === 'function') {
        initializeAIChat();
    }
});



