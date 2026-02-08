
var map = new ol.Map({
    target: 'map',
    renderer: 'canvas',
    layers: layersList,
    view: new ol.View({
         maxZoom: 28, minZoom: 1
    })
});

//initial view - epsg:3857 coordinates if not "Match project CRS"
map.getView().fit([-1920534.015564, 1618509.531695, -1802901.829867, 1704706.607705], map.getSize());

//full zooms only
map.getView().setProperties({constrainResolution: true});

//change cursor
function pointerOnFeature(evt) {
    if (evt.dragging) {
        return;
    }
    var hasFeature = map.hasFeatureAtPixel(evt.pixel, {
        layerFilter: function(layer) {
            return layer && (layer.get("interactive"));
        }
    });
    map.getViewport().style.cursor = hasFeature ? "pointer" : "";
}
map.on('pointermove', pointerOnFeature);
function styleCursorMove() {
    map.on('pointerdrag', function() {
        map.getViewport().style.cursor = "move";
    });
    map.on('pointerup', function() {
        map.getViewport().style.cursor = "default";
    });
}
styleCursorMove();

////small screen definition
    var hasTouchScreen = map.getViewport().classList.contains('ol-touch');
    var isSmallScreen = window.innerWidth < 650;

//popup
var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');
var sketch;

function stopMediaInPopup() {
    var mediaElements = container.querySelectorAll('audio, video');
    mediaElements.forEach(function(media) {
        media.pause();
        media.currentTime = 0;
    });
}
closer.onclick = function() {
    container.style.display = 'none';
    closer.blur();
    stopMediaInPopup();
    return false;
};
var overlayPopup = new ol.Overlay({
    element: container,
	autoPan: true
});
map.addOverlay(overlayPopup)
    
    
var NO_POPUP = 0
var ALL_FIELDS = 1

/**
 * Returns either NO_POPUP, ALL_FIELDS or the name of a single field to use for
 * a given layer
 * @param layerList {Array} List of ol.Layer instances
 * @param layer {ol.Layer} Layer to find field info about
 */
function getPopupFields(layerList, layer) {
    // Determine the index that the layer will have in the popupLayers Array,
    // if the layersList contains more items than popupLayers then we need to
    // adjust the index to take into account the base maps group
    var idx = layersList.indexOf(layer) - (layersList.length - popupLayers.length);
    return popupLayers[idx];
}

//highligth collection
var collection = new ol.Collection();
var featureOverlay = new ol.layer.Vector({
    map: map,
    source: new ol.source.Vector({
        features: collection,
        useSpatialIndex: false // optional, might improve performance
    }),
    style: [new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#f00',
            width: 1
        }),
        fill: new ol.style.Fill({
            color: 'rgba(255,0,0,0.1)'
        }),
    })],
    updateWhileAnimating: true, // optional, for instant visual feedback
    updateWhileInteracting: true // optional, for instant visual feedback
});

var doHighlight = false;
var doHover = false;

function createPopupField(currentFeature, currentFeatureKeys, layer) {
    var popupText = '';
    for (var i = 0; i < currentFeatureKeys.length; i++) {
        if (currentFeatureKeys[i] != 'geometry' && currentFeatureKeys[i] != 'layerObject' && currentFeatureKeys[i] != 'idO') {
            var popupField = '';
            if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "hidden field") {
                continue;
            } else if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "inline label - visible with data") {
                if (currentFeature.get(currentFeatureKeys[i]) == null) {
                    continue;
                }
            }
            if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "inline label - always visible" ||
                layer.get('fieldLabels')[currentFeatureKeys[i]] == "inline label - visible with data") {
                popupField += '<th>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + '</th><td>';
            } else {
                popupField += '<td colspan="2">';
            }
            if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "header label - visible with data") {
                if (currentFeature.get(currentFeatureKeys[i]) == null) {
                    continue;
                }
            }
            if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "header label - always visible" ||
                layer.get('fieldLabels')[currentFeatureKeys[i]] == "header label - visible with data") {
                popupField += '<strong>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + '</strong><br />';
            }
            if (layer.get('fieldImages')[currentFeatureKeys[i]] != "ExternalResource") {
				popupField += (currentFeature.get(currentFeatureKeys[i]) != null ? autolinker.link(currentFeature.get(currentFeatureKeys[i]).toLocaleString()) + '</td>' : '');
			} else {
				var fieldValue = currentFeature.get(currentFeatureKeys[i]);
				if (/\.(gif|jpg|jpeg|tif|tiff|png|avif|webp|svg)$/i.test(fieldValue)) {
					popupField += (fieldValue != null ? '<img src="images/' + fieldValue.replace(/[\\\/:]/g, '_').trim() + '" /></td>' : '');
				} else if (/\.(mp4|webm|ogg|avi|mov|flv)$/i.test(fieldValue)) {
					popupField += (fieldValue != null ? '<video controls><source src="images/' + fieldValue.replace(/[\\\/:]/g, '_').trim() + '" type="video/mp4">Il tuo browser non supporta il tag video.</video></td>' : '');
				} else if (/\.(mp3|wav|ogg|aac|flac)$/i.test(fieldValue)) {
                    popupField += (fieldValue != null ? '<audio controls><source src="images/' + fieldValue.replace(/[\\\/:]/g, '_').trim() + '" type="audio/mpeg">Il tuo browser non supporta il tag audio.</audio></td>' : '');
                } else {
					popupField += (fieldValue != null ? autolinker.link(fieldValue.toLocaleString()) + '</td>' : '');
				}
			}
            popupText += '<tr>' + popupField + '</tr>';
        }
    }
    return popupText;
}

var highlight;
var autolinker = new Autolinker({truncate: {length: 30, location: 'smart'}});

function onPointerMove(evt) {
    if (!doHover && !doHighlight) {
        return;
    }
    var pixel = map.getEventPixel(evt.originalEvent);
    var coord = evt.coordinate;
    var currentFeature;
    var currentLayer;
    var currentFeatureKeys;
    var clusteredFeatures;
    var clusterLength;
    var popupText = '<ul>';

    // Collect all features and their layers at the pixel
    var featuresAndLayers = [];
    map.forEachFeatureAtPixel(pixel, function(feature, layer) {
        if (layer && feature instanceof ol.Feature && (layer.get("interactive") || layer.get("interactive") === undefined)) {
            featuresAndLayers.push({ feature, layer });
        }
    });

    // Iterate over the features and layers in reverse order
    for (var i = featuresAndLayers.length - 1; i >= 0; i--) {
        var feature = featuresAndLayers[i].feature;
        var layer = featuresAndLayers[i].layer;
        var doPopup = false;
        for (k in layer.get('fieldImages')) {
            if (layer.get('fieldImages')[k] != "Hidden") {
                doPopup = true;
            }
        }
        currentFeature = feature;
        currentLayer = layer;
        clusteredFeatures = feature.get("features");
        if (clusteredFeatures) {
            clusterLength = clusteredFeatures.length;
        }
        if (typeof clusteredFeatures !== "undefined") {
            if (doPopup) {
                for(var n=0; n<clusteredFeatures.length; n++) {
                    currentFeature = clusteredFeatures[n];
                    currentFeatureKeys = currentFeature.getKeys();
                    popupText += '<li><table>'
                    popupText += '<a>' + '<b>' + layer.get('popuplayertitle') + '</b>' + '</a>';
                    popupText += createPopupField(currentFeature, currentFeatureKeys, layer);
                    popupText += '</table></li>';    
                }
            }
        } else {
            currentFeatureKeys = currentFeature.getKeys();
            if (doPopup) {
                popupText += '<li><table>';
                popupText += '<a>' + '<b>' + layer.get('popuplayertitle') + '</b>' + '</a>';
                popupText += createPopupField(currentFeature, currentFeatureKeys, layer);
                popupText += '</table></li>';
            }
        }
    }

    if (popupText == '<ul>') {
        popupText = '';
    } else {
        popupText += '</ul>';
    }
    
	if (doHighlight) {
        if (currentFeature !== highlight) {
            if (highlight) {
                featureOverlay.getSource().removeFeature(highlight);
            }
            if (currentFeature) {
                var featureStyle
                if (typeof clusteredFeatures == "undefined") {
					var style = currentLayer.getStyle();
					var styleFunction = typeof style === 'function' ? style : function() { return style; };
					featureStyle = styleFunction(currentFeature)[0];
				} else {
					featureStyle = currentLayer.getStyle().toString();
				}

                if (currentFeature.getGeometry().getType() == 'Point' || currentFeature.getGeometry().getType() == 'MultiPoint') {
                    var radius
					if (typeof clusteredFeatures == "undefined") {
						radius = featureStyle.getImage().getRadius();
					} else {
						radius = parseFloat(featureStyle.split('radius')[1].split(' ')[1]) + clusterLength;
					}

                    highlightStyle = new ol.style.Style({
                        image: new ol.style.Circle({
                            fill: new ol.style.Fill({
                                color: "rgba(255, 255, 0, 1.00)"
                            }),
                            radius: radius
                        })
                    })
                } else if (currentFeature.getGeometry().getType() == 'LineString' || currentFeature.getGeometry().getType() == 'MultiLineString') {

                    var featureWidth = featureStyle.getStroke().getWidth();

                    highlightStyle = new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: 'rgba(255, 255, 0, 1.00)',
                            lineDash: null,
                            width: featureWidth
                        })
                    });

                } else {
                    highlightStyle = new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: 'rgba(255, 255, 0, 1.00)'
                        })
                    })
                }
                featureOverlay.getSource().addFeature(currentFeature);
                featureOverlay.setStyle(highlightStyle);
            }
            highlight = currentFeature;
        }
    }

    if (doHover) {
        if (popupText) {
			content.innerHTML = popupText;
            container.style.display = 'block';
            overlayPopup.setPosition(coord);
        } else {
            container.style.display = 'none';
            closer.blur();
        }
    }
};

map.on('pointermove', onPointerMove);

var popupContent = '';
var popupCoord = null;
var featuresPopupActive = false;

function updatePopup() {
    if (popupContent) {
        content.innerHTML = popupContent;
        container.style.display = 'block';
		overlayPopup.setPosition(popupCoord);
    } else {
        container.style.display = 'none';
        closer.blur();
        stopMediaInPopup();
    }
} 

function onSingleClickFeatures(evt) {
    if (doHover || sketch) {
        return;
    }
    if (!featuresPopupActive) {
        featuresPopupActive = true;
    }
    var pixel = map.getEventPixel(evt.originalEvent);
    var coord = evt.coordinate;
    var currentFeature;
    var currentFeatureKeys;
    var clusteredFeatures;
    var popupText = '<ul>';
    
    map.forEachFeatureAtPixel(pixel, function(feature, layer) {
        if (layer && feature instanceof ol.Feature && (layer.get("interactive") || layer.get("interactive") === undefined)) {
            var doPopup = false;
            for (var k in layer.get('fieldImages')) {
                if (layer.get('fieldImages')[k] !== "Hidden") {
                    doPopup = true;
                }
            }
            currentFeature = feature;
            clusteredFeatures = feature.get("features");
            if (typeof clusteredFeatures !== "undefined") {
                if (doPopup) {
                    for(var n = 0; n < clusteredFeatures.length; n++) {
                        currentFeature = clusteredFeatures[n];
                        currentFeatureKeys = currentFeature.getKeys();
                        popupText += '<li><table>';
                        popupText += '<a><b>' + layer.get('popuplayertitle') + '</b></a>';
                        popupText += createPopupField(currentFeature, currentFeatureKeys, layer);
                        popupText += '</table></li>';    
                    }
                }
            } else {
                currentFeatureKeys = currentFeature.getKeys();
                if (doPopup) {
                    popupText += '<li><table>';
                    popupText += '<a><b>' + layer.get('popuplayertitle') + '</b></a>';
                    popupText += createPopupField(currentFeature, currentFeatureKeys, layer);
                    popupText += '</table>';
                }
            }
        }
    });
    if (popupText === '<ul>') {
        popupText = '';
    } else {
        popupText += '</ul>';
    }
	
	popupContent = popupText;
    popupCoord = coord;
    updatePopup();
}

function onSingleClickWMS(evt) {
    if (doHover || sketch) {
        return;
    }
    if (!featuresPopupActive) {
        popupContent = '';
    }
    var coord = evt.coordinate;
    var viewProjection = map.getView().getProjection();
    var viewResolution = map.getView().getResolution();

    for (var i = 0; i < wms_layers.length; i++) {
        if (wms_layers[i][1] && wms_layers[i][0].getVisible()) {
            var url = wms_layers[i][0].getSource().getFeatureInfoUrl(
                evt.coordinate, viewResolution, viewProjection, {
                    'INFO_FORMAT': 'text/html',
                });
            if (url) {
                const wmsTitle = wms_layers[i][0].get('popuplayertitle');
                var ldsRoller = '<div class="roller-switcher" style="height: 25px; width: 25px;"></div>';

                popupCoord = coord;
                popupContent += ldsRoller;
                updatePopup();

                var timeoutPromise = new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject(new Error('Timeout exceeded'));
                    }, 5000); // (5 second)
                });

                // Function to try fetch with different option
                function tryFetch(urls) {
                    if (urls.length === 0) {
                        return Promise.reject(new Error('All fetch attempts failed'));
                    }
                    return fetch(urls[0])
                        .then((response) => {
                            if (response.ok) {
                                return response.text();
                            } else {
                                throw new Error('Fetch failed');
                            }
                        })
                        .catch(() => tryFetch(urls.slice(1))); // Try next URL
                }

                // List of URLs to try
                // The first URL is the original, the second is the encoded version, and the third is the proxy
                const urlsToTry = [
                    url,
                    encodeURIComponent(url),
                    'https://api.allorigins.win/raw?url=' + encodeURIComponent(url)
                ];

                Promise.race([tryFetch(urlsToTry), timeoutPromise])
                    .then((html) => {
                        if (html.indexOf('<table') !== -1) {
                            popupContent += '<a><b>' + wmsTitle + '</b></a>';
                            popupContent += html + '<p></p>';
                            updatePopup();
                        }
                    })
                    .finally(() => {
                        setTimeout(() => {
                            var loaderIcon = document.querySelector('.roller-switcher');
                            if (loaderIcon) loaderIcon.remove();
                        }, 500); // (0.5 second)
                    });
            }
        }
    }
}

map.on('singleclick', onSingleClickFeatures);
map.on('singleclick', onSingleClickWMS);

//abstract


//geolocate

	let isTracking = false;

	const geolocateButton = document.createElement('button');
	geolocateButton.className = 'geolocate-button fa fa-map-marker';
	geolocateButton.title = 'Geolocalizza';

	const geolocateControl = document.createElement('div');
	geolocateControl.className = 'ol-unselectable ol-control geolocate';
	geolocateControl.appendChild(geolocateButton);
	map.getTargetElement().appendChild(geolocateControl);

	const accuracyFeature = new ol.Feature();
	const positionFeature = new ol.Feature({
	  style: new ol.style.Style({
		image: new ol.style.Circle({
		  radius: 6,
		  fill: new ol.style.Fill({ color: '#3399CC' }),
		  stroke: new ol.style.Stroke({ color: '#fff', width: 2 }),
		}),
	  }),
	});

  const geolocateOverlay = new ol.layer.Vector({
	  source: new ol.source.Vector({
		features: [accuracyFeature, positionFeature],
	  }),
	});
	
	const geolocation = new ol.Geolocation({
	  projection: map.getView().getProjection(),
	});

	geolocation.on('change:accuracyGeometry', function () {
	  accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
	});

	geolocation.on('change:position', function () {
	  const coords = geolocation.getPosition();
	  positionFeature.setGeometry(coords ? new ol.geom.Point(coords) : null);
	});

	geolocation.setTracking(true);

	function handleGeolocate() {
	  if (isTracking) {
		map.removeLayer(geolocateOverlay);
		isTracking = false;
	  } else if (geolocation.getTracking()) {
		map.addLayer(geolocateOverlay);
		const pos = geolocation.getPosition();
		if (pos) {
		  map.getView().setCenter(pos);
		}
		isTracking = true;
	  }
	}

	geolocateButton.addEventListener('click', handleGeolocate);
	geolocateButton.addEventListener('touchstart', handleGeolocate);


//measurement
let measuring = false;

	const measureButton = document.createElement('button');
	measureButton.className = 'measure-button fas fa-ruler';
	measureButton.title = 'Measure';

	const measureControl = document.createElement('div');
	measureControl.className = 'ol-unselectable ol-control measure-control';
	measureControl.appendChild(measureButton);
	map.getTargetElement().appendChild(measureControl);

	// Event handler
	function handleMeasure() {
	  if (!measuring) {
		selectLabel.style.display = "";
		map.addInteraction(draw);
		createHelpTooltip();
		createMeasureTooltip();
		measuring = true;
	  } else {
		selectLabel.style.display = "none";
		map.removeInteraction(draw);
		map.removeOverlay(helpTooltip);
		map.removeOverlay(measureTooltip);
		const staticTooltips = document.getElementsByClassName("tooltip-static");
		while (staticTooltips.length > 0) {
		  staticTooltips[0].parentNode.removeChild(staticTooltips[0]);
		}
		measureLayer.getSource().clear();
		sketch = null;
		measuring = false;
	  }
	}

	measureButton.addEventListener('click', handleMeasure);
	measureButton.addEventListener('touchstart', handleMeasure);

    map.on('pointermove', function(evt) {
        if (evt.dragging) {
            return;
        }
        if (measuring) {
            /** @type {string} */
            var helpMsg = 'Click to start drawing';
            if (sketch) {
                var geom = (sketch.getGeometry());
                if (geom instanceof ol.geom.Polygon) {
                    helpMsg = continuePolygonMsg;
                } else if (geom instanceof ol.geom.LineString) {
                    helpMsg = continueLineMsg;
                }
            }
            helpTooltipElement.innerHTML = helpMsg;
            helpTooltip.setPosition(evt.coordinate);
        }
    });
    

    var selectLabel = document.createElement("label");
    selectLabel.innerHTML = "&nbsp;Measure:&nbsp;";

    var typeSelect = document.createElement("select");
    typeSelect.id = "type";

    var measurementOption = [
        { value: "LineString", description: "Length" },
        { value: "Polygon", description: "Area" }
        ];
    measurementOption.forEach(function (option) {
        var optionElement = document.createElement("option");
        optionElement.value = option.value;
        optionElement.text = option.description;
        typeSelect.appendChild(optionElement);
    });

    selectLabel.appendChild(typeSelect);
    measureControl.appendChild(selectLabel);

    selectLabel.style.display = "none";
	/**
	 * Currently drawn feature.
	 * @type {ol.Feature}
	 */

	/**
	 * The help tooltip element.
	 * @type {Element}
	 */
	var helpTooltipElement;


	/**
	 * Overlay to show the help messages.
	 * @type {ol.Overlay}
	 */
	var helpTooltip;


	/**
	 * The measure tooltip element.
	 * @type {Element}
	 */
	var measureTooltipElement;


	/**
	 * Overlay to show the measurement.
	 * @type {ol.Overlay}
	 */
	var measureTooltip;


	/**
	 * Message to show when the user is drawing a line.
	 * @type {string}
	 */
	var continueLineMsg = 'Click to continue drawing the line';



	/**
	 * Message to show when the user is drawing a polygon.
	 * @type {string}
	 */
	var continuePolygonMsg = "1click continue, 2click close";


	var typeSelect = document.getElementById("type");
	var typeSelectForm = document.getElementById("form_measure");

	typeSelect.onchange = function (e) {		  
	  map.removeInteraction(draw);
	  addInteraction();
	  map.addInteraction(draw);		  
	};

	var measureLineStyle = new ol.style.Style({
	  stroke: new ol.style.Stroke({ 
		color: "rgba(0, 0, 255)", //blu
		lineDash: [10, 10],
		width: 4
	  }),
	  image: new ol.style.Circle({
		radius: 6,
		stroke: new ol.style.Stroke({
		  color: "rgba(255, 255, 255)", 
		  width: 1
		}),
	  })
	});

	var measureLineStyle2 = new ol.style.Style({	  
		stroke: new ol.style.Stroke({
			color: "rgba(255, 255, 255)", 
			lineDash: [10, 10],
			width: 2
		  }),
	  image: new ol.style.Circle({
		radius: 5,
		stroke: new ol.style.Stroke({
		  color: "rgba(0, 0, 255)", 
		  width: 1
		}),
			  fill: new ol.style.Fill({
		  color: "rgba(255, 204, 51, 0.4)", 
		}),
		  })
	});

	var labelStyle = new ol.style.Style({
	  text: new ol.style.Text({
		font: "14px Calibri,sans-serif",
		fill: new ol.style.Fill({
		  color: "rgba(0, 0, 0, 1)"
		}),
		stroke: new ol.style.Stroke({
		  color: "rgba(255, 255, 255, 1)",
		  width: 3
		})
	  })
	});

	var labelStyleCache = [];

	var styleFunction = function (feature, type) {
	  var styles = [measureLineStyle, measureLineStyle2];
	  var geometry = feature.getGeometry();
	  var type = geometry.getType();
	  var lineString;
	  if (!type || type === type) {
		if (type === "Polygon") {
		  lineString = new ol.geom.LineString(geometry.getCoordinates()[0]);
		} else if (type === "LineString") {
		  lineString = geometry;
		}
	  }
	  if (lineString) {
		var count = 0;
		lineString.forEachSegment(function (a, b) {
		  var segment = new ol.geom.LineString([a, b]);
		  var label = formatLength(segment);
		  if (labelStyleCache.length - 1 < count) {
			labelStyleCache.push(labelStyle.clone());
		  }
		  labelStyleCache[count].setGeometry(segment);
		  labelStyleCache[count].getText().setText(label);
		  styles.push(labelStyleCache[count]);
		  count++;
		});
	  }
	  return styles;
	};
	var source = new ol.source.Vector();

	var measureLayer = new ol.layer.Vector({
	  source: source,
	  displayInLayerSwitcher: false,
	  style: function (feature) {
		labelStyleCache = [];
		return styleFunction(feature);
	  }
	});

	map.addLayer(measureLayer);

	var draw; // global so we can remove it later
	function addInteraction() {
	  var type = typeSelect.value;
	  draw = new ol.interaction.Draw({
		source: source,
		type: /** @type {ol.geom.GeometryType} */ (type),
		style: function (feature) {
				  return styleFunction(feature, type);
				}
	  });

	  var listener;
	  draw.on('drawstart',
		  function(evt) {
			// set sketch
			sketch = evt.feature;

			/** @type {ol.Coordinate|undefined} */
			var tooltipCoord = evt.coordinate;

			listener = sketch.getGeometry().on('change', function(evt) {
			  var geom = evt.target;
			  var output;
			  if (geom instanceof ol.geom.Polygon) {
					  output = formatArea(/** @type {ol.geom.Polygon} */ (geom));
					  tooltipCoord = geom.getInteriorPoint().getCoordinates();
					} else if (geom instanceof ol.geom.LineString) {
					  output = formatLength(/** @type {ol.geom.LineString} */ (geom));
					  tooltipCoord = geom.getLastCoordinate();
					}
			  measureTooltipElement.innerHTML = output;
			  measureTooltip.setPosition(tooltipCoord);
			});
		  }, this);

	  draw.on('drawend',
		  function(evt) {
			measureTooltipElement.className = 'tooltip tooltip-static';
			measureTooltip.setOffset([0, -7]);
			// unset sketch
			sketch = null;
			// unset tooltip so that a new one can be created
			measureTooltipElement = null;
			createMeasureTooltip();
			ol.Observable.unByKey(listener);
		  }, this);
	}


	/**
	 * Creates a new help tooltip
	 */
	function createHelpTooltip() {
	  if (helpTooltipElement) {
		helpTooltipElement.parentNode.removeChild(helpTooltipElement);
	  }
	  helpTooltipElement = document.createElement('div');
	  helpTooltipElement.className = 'tooltip hidden';
	  helpTooltip = new ol.Overlay({
		element: helpTooltipElement,
		offset: [15, 0],
		positioning: 'center-left'
	  });
	  map.addOverlay(helpTooltip);
	}


	/**
	 * Creates a new measure tooltip
	 */
	function createMeasureTooltip() {
	  if (measureTooltipElement) {
		measureTooltipElement.parentNode.removeChild(measureTooltipElement);
	  }
	  measureTooltipElement = document.createElement('div');
	  measureTooltipElement.className = 'tooltip tooltip-measure';
	  measureTooltip = new ol.Overlay({
		element: measureTooltipElement,
		offset: [0, -15],
		positioning: 'bottom-center'
	  });
	  map.addOverlay(measureTooltip);
	}


  /**
  * format length output
  * @param {ol.geom.LineString} line
  * @return {string}
  */
  var formatLength = function(line) {
    var length;
    var coordinates = line.getCoordinates();
    length = 0;
    var sourceProj = map.getView().getProjection();
    for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
        var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
        var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
        length += ol.sphere.getDistance(c1, c2);
      }
    var output;
    if (length > 100) {
      output = (Math.round(length / 1000 * 100) / 100) +
          ' ' + 'km';
    } else {
      output = (Math.round(length * 100) / 100) +
          ' ' + 'm';
    }
    return output;
  };

  /**
  * Format area output.
  * @param {ol.geom.Polygon} polygon The polygon.
  * @return {string} Formatted area.
  */
	var formatArea = function (polygon) {
		var sourceProj = map.getView().getProjection();
		var geom = polygon.clone().transform(sourceProj, 'EPSG:3857');
		var area = Math.abs(ol.sphere.getArea(geom));
		var output;
		if (area > 1000000) {
			output = Math.round((area / 1000000) * 1000) / 1000 + ' ' + 'km<sup>2</sup>';
		} else {
			output = Math.round(area * 100) / 100 + ' ' + 'm<sup>2</sup>';
		}
		return output.replace('.', ',');
	};

  addInteraction();

  var parentElement = document.querySelector(".measure-control");
  var elementToMove = document.getElementById("form_measure");
  if (elementToMove && parentElement) {
    parentElement.insertBefore(elementToMove, parentElement.firstChild);
  }


//geocoder

  //Layer to represent the point of the geocoded address
  var geocoderLayer = new ol.layer.Vector({
      source: new ol.source.Vector(),
  });
  map.addLayer(geocoderLayer);
  var vectorSource = geocoderLayer.getSource();

  //Variable used to store the coordinates of geocoded addresses
  var obj2 = {
  value: '',
  letMeKnow() {
      //console.log(`Geocoded position: ${this.gcd}`);
  },
  get gcd() {
      return this.value;
  },
  set gcd(value) {
      this.value = value;
      this.letMeKnow();
  }
  }

  var obj = {
      value: '',
      get label() {
          return this.value;
      },
      set label(value) {
          this.value = value;
      }
  }

  // Function to handle the selected address
  function onSelected(feature) {
      obj.label = feature;
      input.value = typeof obj.label.properties.label === "undefined"? obj.label.properties.display_name : obj.label.properties.label;
      var coordinates = ol.proj.transform(
      [feature.geometry.coordinates[0], feature.geometry.coordinates[1]],
      "EPSG:4326",
      map.getView().getProjection()
      );
      vectorSource.clear(true);
      obj2.gcd = [feature.geometry.coordinates[0], feature.geometry.coordinates[1]];
      var marker = new ol.Feature(new ol.geom.Point(coordinates));
      var zIndex = 1;
      marker.setStyle(new ol.style.Style({
      image: new ol.style.Icon(({
          anchor: [0.5, 1],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
          scale: 0.7,
          opacity: 1,
          src: "./resources/marker.png",
          zIndex: zIndex
      })),
      zIndex: zIndex
      }));
      vectorSource.addFeature(marker);
      map.getView().setCenter(coordinates);
      map.getView().setZoom(18);
  }

  // Format the result in the autocomplete search bar
  var formatResult = function (feature, el) {
      var title = document.createElement("strong");
      el.appendChild(title);
      var detailsContainer = document.createElement("small");
      el.appendChild(detailsContainer);
      var details = [];
      title.innerHTML = feature.properties.label || feature.properties.display_name;
      var types = {
      housenumber: "numéro",
      street: "rue",
      locality: "lieu-dit",
      municipality: "commune",
      };
      if (
      feature.properties.city &&
      feature.properties.city !== feature.properties.name
      ) {
      details.push(feature.properties.city);
      }
      if (feature.properties.context) {
      details.push(feature.properties.context);
      }
      detailsContainer.innerHTML = details.join(", ");
  };

  // Define a class to create the control button for the search bar in a div tag
  class AddDomControl extends ol.control.Control {
      constructor(elementToAdd, opt_options) {
      const options = opt_options || {};

      const element = document.createElement("div");
      if (options.className) {
          element.className = options.className;
      }
      element.appendChild(elementToAdd);

      super({
          element: element,
          target: options.target,
      });
      }
  }

  // Function to show you can do something with the returned elements
  function myHandler(featureCollection) {
      //console.log(featureCollection);
  }

  // URL for API
  const url = {"Nominatim OSM": "https://nominatim.openstreetmap.org/search?format=geojson&addressdetails=1&",
  "France BAN": "https://api-adresse.data.gouv.fr/search/?"}
  var API_URL = "//api-adresse.data.gouv.fr";

  // Create search by adresses component
  var containers = new Photon.Search({
    resultsHandler: myHandler,
    onSelected: onSelected,
    placeholder: "Search an address",
    formatResult: formatResult,
    //url: API_URL + "/search/?",
    url: url["Nominatim OSM"],
    position: "topright",
    // ,includePosition: function() {
    //   return ol.proj.transform(
    //     map.getView().getCenter(),
    //     map.getView().getProjection(), //'EPSG:3857',
    //     'EPSG:4326'
    //   );
    // }
  });

  // Add the created DOM element within the map
  //var left = document.getElementById("top-left-container");
  var controlGeocoder = new AddDomControl(containers, {
    className: "photon-geocoder-autocomplete ol-unselectable ol-control",
  });
  map.addControl(controlGeocoder);
  var search = document.getElementsByClassName("photon-geocoder-autocomplete ol-unselectable ol-control")[0];
  search.style.display = "flex";

  // Create the new button element
  var button = document.createElement("button");
  button.type = "button";
  button.id = "gcd-button-control";
  button.className = "gcd-gl-btn fa fa-search leaflet-control";

  // Ajouter le bouton à l'élément parent
  search.insertBefore(button, search.firstChild);
  last = search.lastChild;
  last.style.display = "none";
  button.addEventListener("click", function (e) {
      if (last.style.display === "none") {
          last.style.display = "block";
      } else {
          last.style.display = "none";
      }
  });
  input = document.getElementsByClassName("photon-input")[0];
  //var searchbar = document.getElementsByClassName("photon-geocoder-autocomplete ol-unselectable ol-control")[0]
  //left.appendChild(searchbar);
        

//layer search

var searchLayer = new SearchLayer({
    layer: lyr_Arrondissment_4,
    colName: 'arr',
    zoom: 10,
    collapsed: true,
    map: map,
    maxResults: 10,
});
map.addControl(searchLayer);
document.getElementsByClassName('search-layer')[0].getElementsByTagName('button')[0].className += ' fa fa-binoculars';
document.getElementsByClassName('search-layer-input-search')[0].placeholder = 'Search feature ...';
    

//scalebar


//layerswitcher






//attribution
var bottomAttribution = new ol.control.Attribution({
  collapsible: false,
  collapsed: false,
  className: 'bottom-attribution'
});
map.addControl(bottomAttribution);

var attributionList = document.createElement('li');
attributionList.innerHTML = `
	<a href="https://github.com/qgis2web/qgis2web">qgis2web</a> &middot;
	<a href="https://openlayers.org/">OpenLayers</a> &middot;
	<a href="https://qgis.org/">QGIS</a>	
`;
var bottomAttributionUl = bottomAttribution.element.querySelector('ul');
if (bottomAttributionUl) {
  bottomAttribution.element.insertBefore(attributionList, bottomAttributionUl);
}


// Disable "popup on hover" or "highlight on hover" if ol-control mouseover
var preDoHover = doHover;
var preDoHighlight = doHighlight;
var isPopupAllActive = false;
document.addEventListener('DOMContentLoaded', function() {
	if (doHover || doHighlight) {
		var controlElements = document.getElementsByClassName('ol-control');
		for (var i = 0; i < controlElements.length; i++) {
			controlElements[i].addEventListener('mouseover', function() { 
				doHover = false;
				doHighlight = false;
			});
			controlElements[i].addEventListener('mouseout', function() {
				doHover = preDoHover;
				if (isPopupAllActive) { return }
				doHighlight = preDoHighlight;
			});
		}
	}
});


// Overview Map
var overviewMapControl = new ol.control.OverviewMap({
    className: 'ol-overviewmap ol-custom-overviewmap',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    collapseLabel: '\u00BB',
    label: '\u00AB',
    collapsed: false
});
map.addControl(overviewMapControl);

// Coordinates
var mousePositionControl = new ol.control.MousePosition({
    coordinateFormat: ol.coordinate.createStringXY(4),
    projection: 'EPSG:4326',
    className: 'custom-mouse-position',
    target: document.getElementById('mouse-position'),
    undefinedHTML: '&nbsp;'
});
map.addControl(mousePositionControl);

// Scale Line
var scaleLineControl = new ol.control.ScaleLine({
    target: document.getElementById('scale-line')
});
map.addControl(scaleLineControl);

// Helper functions for UI
window.togglePanel = function(id) {
    var panel = document.getElementById(id);
    if (panel.classList.contains('collapsed')) {
        panel.classList.remove('collapsed');
    } else {
        panel.classList.add('collapsed');
    }
    setTimeout(function() { map.updateSize(); }, 300);
};

window.toggleModal = function(id) {
    var modal = document.getElementById(id);
    modal.style.display = (modal.style.display === "block") ? "none" : "block";
};

// Attribute Query
window.activateAttributeQuery = function() {
    var modal = document.getElementById('queryModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'queryModal';
        modal.className = 'modal';
        var content = document.createElement('div');
        content.className = 'modal-content';
        content.innerHTML = `
            <span class="close-modal" onclick="toggleModal('queryModal')">&times;</span>
            <h2>Requête Attributaire</h2>
            <div style="margin-bottom: 15px;">
                <label for="layerSelect" style="font-weight:bold;">Couche:</label>
                <select id="layerSelect" style="width: 100%; padding: 5px; margin-top: 5px;"></select>
            </div>
            <div style="margin-bottom: 15px;">
                <label for="fieldSelect" style="font-weight:bold;">Attribut:</label>
                <select id="fieldSelect" style="width: 100%; padding: 5px; margin-top: 5px;" disabled></select>
            </div>
            <div style="margin-bottom: 15px;">
                <label for="valueSelect" style="font-weight:bold;">Valeur:</label>
                <select id="valueSelect" style="width: 100%; padding: 5px; margin-top: 5px;" disabled></select>
            </div>
            <button id="executeQueryBtn" style="padding: 8px 15px; background-color: #005a8d; color: white; border: none; cursor: pointer; border-radius: 4px;">Rechercher</button>
        `;
        modal.appendChild(content);
        document.body.appendChild(modal);

        document.getElementById('layerSelect').addEventListener('change', function() {
            var layerName = this.value;
            var fieldSelect = document.getElementById('fieldSelect');
            var valueSelect = document.getElementById('valueSelect');
            
            fieldSelect.innerHTML = '<option value="">Sélectionner un attribut</option>';
            fieldSelect.disabled = true;
            valueSelect.innerHTML = '<option value="">Sélectionner une valeur</option>';
            valueSelect.disabled = true;

            if (!layerName) return;

            var selectedLayer;
            map.getLayers().forEach(function(layer) {
                if ((layer.get('popuplayertitle') || layer.get('title')) === layerName) {
                    selectedLayer = layer;
                }
            });

            if (selectedLayer) {
                var aliases = selectedLayer.get('fieldAliases');
                if (aliases) {
                    for (var key in aliases) {
                         var option = document.createElement('option');
                         option.value = key;
                         option.text = aliases[key] || key;
                         fieldSelect.appendChild(option);
                    }
                    fieldSelect.disabled = false;
                }
            }
        });

        document.getElementById('fieldSelect').addEventListener('change', function() {
            var layerName = document.getElementById('layerSelect').value;
            var fieldName = this.value;
            var valueSelect = document.getElementById('valueSelect');
            
            valueSelect.innerHTML = '<option value="">Sélectionner une valeur</option>';
            valueSelect.disabled = true;

            if (!layerName || !fieldName) return;

            var selectedLayer;
            map.getLayers().forEach(function(layer) {
                if ((layer.get('popuplayertitle') || layer.get('title')) === layerName) {
                    selectedLayer = layer;
                }
            });

            if (selectedLayer) {
                var source = selectedLayer.getSource();
                if (source instanceof ol.source.Cluster) {
                    source = source.getSource();
                }
                var features = source.getFeatures();
                var uniqueValues = new Set();
                features.forEach(function(feature) {
                    var val = feature.get(fieldName);
                    if (val !== undefined && val !== null) {
                        uniqueValues.add(String(val));
                    }
                });
                
                var sortedValues = Array.from(uniqueValues).sort();
                sortedValues.forEach(function(val) {
                    var option = document.createElement('option');
                    option.value = val;
                    option.text = val;
                    valueSelect.appendChild(option);
                });
                valueSelect.disabled = false;
            }
        });

        document.getElementById('executeQueryBtn').addEventListener('click', function() {
            var layerName = document.getElementById('layerSelect').value;
            var fieldName = document.getElementById('fieldSelect').value;
            var value = document.getElementById('valueSelect').value;

            if (!layerName || !fieldName || !value) {
                alert("Veuillez sélectionner tous les champs.");
                return;
            }

            var found = false;
            map.getLayers().forEach(function(layer) {
                if ((layer.get('popuplayertitle') || layer.get('title')) === layerName) {
                    var source = layer.getSource();
                    if (source instanceof ol.source.Cluster) {
                        source = source.getSource();
                    }
                    var features = source.getFeatures();
                    features.forEach(function(feature) {
                        if (String(feature.get(fieldName)) === value) {
                            var extent = feature.getGeometry().getExtent();
                            map.getView().fit(extent, {padding: [50, 50, 50, 50], maxZoom: 16});
                            found = true;
                            if (typeof highlight !== 'undefined') {
                                 featureOverlay.getSource().clear();
                                 featureOverlay.getSource().addFeature(feature);
                            }
                        }
                    });
                }
            });
            
            if (found) {
                toggleModal('queryModal');
            } else {
                alert("Aucune entité trouvée.");
            }
        });
    }

    var layerSelect = document.getElementById('layerSelect');
    layerSelect.innerHTML = '<option value="">Sélectionner une couche</option>';
    document.getElementById('fieldSelect').innerHTML = '<option value="">Sélectionner un attribut</option>';
    document.getElementById('fieldSelect').disabled = true;
    document.getElementById('valueSelect').innerHTML = '<option value="">Sélectionner une valeur</option>';
    document.getElementById('valueSelect').disabled = true;

    map.getLayers().forEach(function(layer) {
        if (layer instanceof ol.layer.Vector && layer.getVisible() && (layer.get('popuplayertitle') || layer.get('title'))) {
            var option = document.createElement('option');
            var title = layer.get('popuplayertitle') || layer.get('title');
            option.value = title;
            option.text = title;
            layerSelect.appendChild(option);
        }
    });

    toggleModal('queryModal');
};

// Spatial Query
window.activateSpatialQuery = function() {
    alert("Dessinez un rectangle pour sélectionner des entités.");
    var dragBox = new ol.interaction.DragBox({
        condition: ol.events.condition.always
    });
    map.addInteraction(dragBox);
    dragBox.on('boxend', function() {
        var extent = dragBox.getGeometry().getExtent();
        var selectedFeatures = [];
        map.getLayers().forEach(function(layer) {
            if (layer instanceof ol.layer.Vector && layer.getVisible()) {
                layer.getSource().forEachFeatureIntersectingExtent(extent, function(feature) {
                    selectedFeatures.push(feature);
                });
            }
        });
        
        if (selectedFeatures.length > 0) {
            featureOverlay.getSource().clear();
            featureOverlay.getSource().addFeatures(selectedFeatures);
            alert(selectedFeatures.length + " entités sélectionnées.");
        } else {
            alert("Aucune entité trouvée dans la zone.");
        }
        map.removeInteraction(dragBox);
    });
};

// Download Data
window.downloadData = function() {
    var modal = document.getElementById('downloadModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'downloadModal';
        modal.className = 'modal';
        var content = document.createElement('div');
        content.className = 'modal-content';
        content.innerHTML = `
            <span class="close-modal" onclick="toggleModal('downloadModal')">&times;</span>
            <h2>Télécharger les données</h2>
            <div style="margin-bottom: 15px;">
                <label for="formatSelect" style="font-weight:bold;">Format :</label>
                <select id="formatSelect" style="width: 100%; padding: 5px; margin-top: 5px;">
                    <option value="geojson">GeoJSON</option>
                    <option value="csv">CSV</option>
                </select>
            </div>
            <button id="confirmDownloadBtn" style="padding: 8px 15px; background-color: #005a8d; color: white; border: none; cursor: pointer; border-radius: 4px;">Télécharger</button>
        `;
        modal.appendChild(content);
        document.body.appendChild(modal);

        document.getElementById('confirmDownloadBtn').addEventListener('click', function() {
            var formatChoice = document.getElementById('formatSelect').value;

            var allFeatures = [];
            map.getLayers().forEach(function(layer) {
                if (layer instanceof ol.layer.Vector && layer.getVisible()) {
                     var source = layer.getSource();
                     // Si c'est un cluster, on récupère la source originale pour avoir les données brutes
                     if (source instanceof ol.source.Cluster) {
                         source = source.getSource();
                     }
                     if (source && typeof source.getFeatures === 'function') {
                         allFeatures = allFeatures.concat(source.getFeatures());
                     }
                }
            });
            
            if (allFeatures.length === 0) {
                alert("Aucune donnée visible à télécharger.");
                return;
            }
            
            var content, mimeType, ext;
            if (formatChoice === 'csv') {
                var keys = [];
                allFeatures.forEach(function(f) {
                    f.getKeys().forEach(function(k) {
                        if (k !== 'geometry' && keys.indexOf(k) === -1) keys.push(k);
                    });
                });
                content = keys.join(',') + '\n';
                allFeatures.forEach(function(f) {
                    var row = keys.map(function(k) {
                        var v = f.get(k);
                        return v === undefined ? '' : '"' + String(v).replace(/"/g, '""') + '"';
                    });
                    content += row.join(',') + '\n';
                });
                mimeType = 'text/csv;charset=utf-8;';
                ext = 'csv';
            } else if (formatChoice === 'geojson') {
                var format = new ol.format.GeoJSON();
                content = format.writeFeatures(allFeatures, {
                    featureProjection: map.getView().getProjection()
                });
                mimeType = 'application/json';
                ext = 'geojson';
            }
            
            var blob = new Blob([content], {type: mimeType});
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = "data." + ext;
            a.click();
            
            toggleModal('downloadModal');
        });
    }
    toggleModal('downloadModal');
};

// Toggle Measure
window.toggleMeasure = function() {
    if (typeof handleMeasure === 'function') {
        handleMeasure();
    }
};

// Move Geocoder to Navbar
setTimeout(function() {
    var geocoder = document.querySelector('.photon-geocoder-autocomplete');
    var container = document.getElementById('geocoder-container');
    if (geocoder && container) {
        container.appendChild(geocoder);
    }
}, 1000);

// Init Left Panel (Catalogue des données)
function initLeftPanel() {
    var container = document.getElementById('left-panel-content');
    if (!container) return;
    container.innerHTML = '';
    
    var overlays = [];
    map.getLayers().forEach(function(layer) {
        if (layer.get('type') !== 'base' && (layer.get('title') || layer.get('popuplayertitle'))) {
            overlays.push(layer);
        }
    });
    
    // Inverser l'ordre pour afficher les couches du haut en premier
    overlays.reverse().forEach(function(layer) {
        var row = document.createElement('div');
        row.className = 'layer-item';
        row.style.marginBottom = '10px';
        row.style.borderBottom = '1px solid #eee';
        row.style.paddingBottom = '5px';
        
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = layer.getVisible();
        checkbox.style.marginRight = '8px';
        checkbox.onchange = function() {
            layer.setVisible(this.checked);
        };
        
        var label = document.createElement('span');
        label.textContent = layer.get('popuplayertitle') || layer.get('title');
        label.style.fontWeight = 'bold';
        label.style.fontSize = '15px';
        
        row.appendChild(checkbox);
        row.appendChild(label);

        // Statistics
        var statsDiv = document.createElement('div');
        statsDiv.style.fontSize = '0.85em';
        statsDiv.style.marginLeft = '22px';
        statsDiv.style.color = '#555';
        statsDiv.style.fontWeight = 'normal';
        
        var source = layer.getSource();
        if (source instanceof ol.source.Cluster) {
            source = source.getSource();
        }
        
        if (source && typeof source.getFeatures === 'function') {
            var features = source.getFeatures();
            if (features.length > 0) {
                var type = features[0].getGeometry().getType();
                if (type.indexOf('Line') !== -1) {
                    var totalLength = 0;
                    features.forEach(function(f) {
                        totalLength += ol.sphere.getLength(f.getGeometry());
                    });
                    statsDiv.innerText = "Linéaire total : " + (totalLength / 1000).toFixed(2) + " km";
                } else {
                    statsDiv.innerText = "Nombre total : " + features.length;
                }
                row.appendChild(statsDiv);
            }
        }

        container.appendChild(row);
    });
}
map.once('postrender', initLeftPanel);

// Init Right Panel (Legend & Basemaps)
function initRightPanel() {
    var legendDiv = document.getElementById('legend-content');
    legendDiv.innerHTML = ''; // Clear existing
    var basemapDiv = document.getElementById('basemaps-list');
    basemapDiv.innerHTML = '';

    var basemaps = [];
    var overlays = [];
    
    // Separate basemaps and overlays
    map.getLayers().forEach(function(layer) {
        if (layer.get('type') === 'base') {
            basemaps.push(layer);
        } else {
            if (layer.get('title') || layer.get('popuplayertitle')) {
                overlays.push(layer);
            }
        }
    });

    // Sort overlays: Points (1) < Lines (2) < Polygons (3) < Others (4)
    overlays.sort(function(a, b) {
        function getScore(layer) {
            var source = layer.getSource();
            if (source instanceof ol.source.Cluster) return 1; // Points (Cluster)
            if (source && typeof source.getFeatures === 'function') {
                var features = source.getFeatures();
                if (features.length > 0) {
                    var type = features[0].getGeometry().getType();
                    if (type.indexOf('Point') !== -1) return 1;
                    if (type.indexOf('Line') !== -1) return 2;
                    if (type.indexOf('Polygon') !== -1) return 3;
                }
            }
            return 4;
        }
        return getScore(a) - getScore(b);
    });

    // 1. Legend Section (Overlays only)
    overlays.forEach(function(layer) {
        var title = layer.get('title') || layer.get('popuplayertitle');
        if (title) {
             var item = document.createElement('div');
             item.className = 'legend-item';
             // Use innerHTML to render the exact symbols (images) provided by QGIS
             item.innerHTML = title;
             legendDiv.appendChild(item);
        }
    });

    // 2. Basemap Section
    basemaps.forEach(function(layer) {
        var container = document.createElement('div');
        container.className = 'basemap-option';
        var radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'basemap';
        radio.value = layer.get('title');
        radio.checked = layer.getVisible();
        radio.onchange = function() {
            basemaps.forEach(function(l) {
                l.setVisible(l.get('title') === this.value);
            }.bind(this));
        };
        var label = document.createElement('label');
        label.innerText = layer.get('title');
        label.style.marginLeft = '5px';
        container.appendChild(radio);
        container.appendChild(label);
        basemapDiv.appendChild(container);
    });
}
map.once('postrender', initRightPanel);