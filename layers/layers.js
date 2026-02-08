var wms_layers = [];


        var lyr_DarkMatter_0 = new ol.layer.Tile({
            'title': 'Dark Matter',
            'type':'base',
            'opacity': 1.000000,
            
            
            source: new ol.source.XYZ({
            attributions: '&nbsp;&middot; <a href="https://cartodb.com/basemaps/">Map tiles by CartoDB, under CC BY 3.0. Data by OpenStreetMap, under ODbL.</a>',
                url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
            })
        });

        var lyr_OSMStandard_1 = new ol.layer.Tile({
            'title': 'OSM Standard',
            'type':'base',
            'opacity': 1.000000,
            
            
            source: new ol.source.XYZ({
            attributions: '&nbsp;&middot; <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors, CC-BY-SA</a>',
                url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            })
        });

        var lyr_GoogleSatellite_2 = new ol.layer.Tile({
            'title': 'Google Satellite',
            'type':'base',
            'opacity': 1.000000,
            
            
            source: new ol.source.XYZ({
            attributions: '&nbsp;&middot; <a href="https://www.google.at/permissions/geoguidelines/attr-guide.html">Map data ©2015 Google</a>',
                url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
            })
        });
var format_Departement_3 = new ol.format.GeoJSON();
var features_Departement_3 = format_Departement_3.readFeatures(json_Departement_3, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_Departement_3 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_Departement_3.addFeatures(features_Departement_3);
var lyr_Departement_3 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_Departement_3, 
                style: style_Departement_3,
                popuplayertitle: 'Departement',
                interactive: true,
    title: 'Departement<br />\
    MBOUR <img src="styles/legend/Departement_3_0.png" /><br />\
    THIES <img src="styles/legend/Departement_3_1.png" /><br />\
    TIVAOUANE <img src="styles/legend/Departement_3_2.png" /><br />' });
var format_Arrondissment_4 = new ol.format.GeoJSON();
var features_Arrondissment_4 = format_Arrondissment_4.readFeatures(json_Arrondissment_4, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_Arrondissment_4 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_Arrondissment_4.addFeatures(features_Arrondissment_4);
var lyr_Arrondissment_4 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_Arrondissment_4, 
                style: style_Arrondissment_4,
                popuplayertitle: 'Arrondissment',
                interactive: true,
                title: 'Arrondissment <img src="styles/legend/Arrondissment_4.png" />'
            });
var format_Routes_5 = new ol.format.GeoJSON();
var features_Routes_5 = format_Routes_5.readFeatures(json_Routes_5, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_Routes_5 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_Routes_5.addFeatures(features_Routes_5);
var lyr_Routes_5 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_Routes_5, 
                style: style_Routes_5,
                popuplayertitle: 'Routes',
                interactive: true,
                title: 'Routes <img src="styles/legend/Routes_5.png" />'
            });
var format_Hydrographie_6 = new ol.format.GeoJSON();
var features_Hydrographie_6 = format_Hydrographie_6.readFeatures(json_Hydrographie_6, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_Hydrographie_6 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_Hydrographie_6.addFeatures(features_Hydrographie_6);
var lyr_Hydrographie_6 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_Hydrographie_6, 
                style: style_Hydrographie_6,
                popuplayertitle: 'Hydrographie',
                interactive: false,
                title: 'Hydrographie <img src="styles/legend/Hydrographie_6.png" />'
            });
var format_Localit_7 = new ol.format.GeoJSON();
var features_Localit_7 = format_Localit_7.readFeatures(json_Localit_7, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_Localit_7 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_Localit_7.addFeatures(features_Localit_7);
cluster_Localit_7 = new ol.source.Cluster({
  distance: 30,
  source: jsonSource_Localit_7
});
var lyr_Localit_7 = new ol.layer.Vector({
                declutter: false,
                source:cluster_Localit_7, 
                style: style_Localit_7,
                popuplayertitle: 'Localité',
                interactive: true,
                title: 'Localité <img src="styles/legend/Localit_7.png" />'
            });
var format_Ecoles_8 = new ol.format.GeoJSON();
var features_Ecoles_8 = format_Ecoles_8.readFeatures(json_Ecoles_8, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_Ecoles_8 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_Ecoles_8.addFeatures(features_Ecoles_8);
var lyr_Ecoles_8 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_Ecoles_8, 
                style: style_Ecoles_8,
                popuplayertitle: 'Ecoles',
                interactive: true,
                title: 'Ecoles <img src="styles/legend/Ecoles_8.png" />'
            });

lyr_DarkMatter_0.setVisible(true);lyr_OSMStandard_1.setVisible(true);lyr_GoogleSatellite_2.setVisible(true);lyr_Departement_3.setVisible(true);lyr_Arrondissment_4.setVisible(true);lyr_Routes_5.setVisible(true);lyr_Hydrographie_6.setVisible(true);lyr_Localit_7.setVisible(true);lyr_Ecoles_8.setVisible(true);
var layersList = [lyr_DarkMatter_0,lyr_OSMStandard_1,lyr_GoogleSatellite_2,lyr_Departement_3,lyr_Arrondissment_4,lyr_Routes_5,lyr_Hydrographie_6,lyr_Localit_7,lyr_Ecoles_8];
lyr_Departement_3.set('fieldAliases', {'OBJECTID_1': 'OBJECTID_1', 'ogr_fid': 'ogr_fid', 'objectid_2': 'objectid_2', 'objectid': 'objectid', 'statut': 'statut', 'cod_reg': 'cod_reg', 'reg': 'reg', 'dept': 'dept', 'cod_dept': 'cod_dept', 'ccod_dept': 'ccod_dept', 'shape_leng': 'shape_leng', 'Shape_Le_1': 'Shape_Le_1', 'Shape_Area': 'Shape_Area', });
lyr_Arrondissment_4.set('fieldAliases', {'OBJECTID': 'OBJECTID', 'statut': 'statut', 'cod_reg': 'cod_reg', 'reg': 'reg', 'dept': 'dept', 'cod_dept': 'cod_dept', 'ccod_dept': 'ccod_dept', 'cav': 'cav', 'cod_cav': 'cod_cav', 'ccod_cav': 'ccod_cav', 'arr': 'arr', 'code_arr': 'code_arr', });
lyr_Routes_5.set('fieldAliases', {'FNODE_': 'FNODE_', 'TNODE_': 'TNODE_', 'LPOLY_': 'LPOLY_', 'RPOLY_': 'RPOLY_', 'LONGUEUR': 'LONGUEUR', 'ROUTESA3_': 'ROUTESA3_', 'ROUTESA3_I': 'ROUTESA3_I', 'CODE': 'CODE', 'FONCTION': 'FONCTION', });
lyr_Hydrographie_6.set('fieldAliases', {'FNODE_': 'FNODE_', 'TNODE_': 'TNODE_', 'LPOLY_': 'LPOLY_', 'RPOLY_': 'RPOLY_', 'LENGTH': 'LENGTH', 'HYDROLA3_': 'HYDROLA3_', 'HYDROLA3_I': 'HYDROLA3_I', 'CODE': 'CODE', 'NOM': 'NOM', 'LIBELLE': 'LIBELLE', });
lyr_Localit_7.set('fieldAliases', {'ENTITY': 'ENTITY', 'LAYER': 'LAYER', 'ELEVATION': 'ELEVATION', 'THICKNESS': 'THICKNESS', 'COLOR': 'COLOR', 'NOM': 'NOM', 'NUM_VILLAG': 'NUM_VILLAG', 'X_UTM': 'X_UTM', 'Y_UTM': 'Y_UTM', });
lyr_Ecoles_8.set('fieldAliases', {'osm_id': 'osm_id', 'code': 'code', 'Type': 'Type', 'Nom': 'Nom', });
lyr_Departement_3.set('fieldImages', {'OBJECTID_1': 'TextEdit', 'ogr_fid': 'TextEdit', 'objectid_2': 'TextEdit', 'objectid': 'TextEdit', 'statut': 'TextEdit', 'cod_reg': 'TextEdit', 'reg': 'TextEdit', 'dept': 'TextEdit', 'cod_dept': 'TextEdit', 'ccod_dept': 'TextEdit', 'shape_leng': 'TextEdit', 'Shape_Le_1': 'TextEdit', 'Shape_Area': 'TextEdit', });
lyr_Arrondissment_4.set('fieldImages', {'OBJECTID': 'TextEdit', 'statut': 'TextEdit', 'cod_reg': 'TextEdit', 'reg': 'TextEdit', 'dept': 'TextEdit', 'cod_dept': 'TextEdit', 'ccod_dept': 'TextEdit', 'cav': 'TextEdit', 'cod_cav': 'TextEdit', 'ccod_cav': 'TextEdit', 'arr': 'TextEdit', 'code_arr': 'TextEdit', });
lyr_Routes_5.set('fieldImages', {'FNODE_': '', 'TNODE_': '', 'LPOLY_': '', 'RPOLY_': '', 'LONGUEUR': '', 'ROUTESA3_': '', 'ROUTESA3_I': '', 'CODE': '', 'FONCTION': '', });
lyr_Hydrographie_6.set('fieldImages', {'FNODE_': 'TextEdit', 'TNODE_': 'TextEdit', 'LPOLY_': 'TextEdit', 'RPOLY_': 'TextEdit', 'LENGTH': 'TextEdit', 'HYDROLA3_': 'TextEdit', 'HYDROLA3_I': 'TextEdit', 'CODE': 'Range', 'NOM': 'TextEdit', 'LIBELLE': 'TextEdit', });
lyr_Localit_7.set('fieldImages', {'ENTITY': 'TextEdit', 'LAYER': 'TextEdit', 'ELEVATION': 'TextEdit', 'THICKNESS': 'TextEdit', 'COLOR': 'Range', 'NOM': 'TextEdit', 'NUM_VILLAG': 'TextEdit', 'X_UTM': 'TextEdit', 'Y_UTM': 'TextEdit', });
lyr_Ecoles_8.set('fieldImages', {'osm_id': 'TextEdit', 'code': 'Range', 'Type': 'TextEdit', 'Nom': 'TextEdit', });
lyr_Departement_3.set('fieldLabels', {'OBJECTID_1': 'hidden field', 'ogr_fid': 'hidden field', 'objectid_2': 'hidden field', 'objectid': 'hidden field', 'statut': 'hidden field', 'cod_reg': 'hidden field', 'reg': 'hidden field', 'dept': 'header label - always visible', 'cod_dept': 'hidden field', 'ccod_dept': 'hidden field', 'shape_leng': 'hidden field', 'Shape_Le_1': 'hidden field', 'Shape_Area': 'hidden field', });
lyr_Arrondissment_4.set('fieldLabels', {'OBJECTID': 'hidden field', 'statut': 'hidden field', 'cod_reg': 'hidden field', 'reg': 'hidden field', 'dept': 'hidden field', 'cod_dept': 'hidden field', 'ccod_dept': 'hidden field', 'cav': 'hidden field', 'cod_cav': 'hidden field', 'ccod_cav': 'hidden field', 'arr': 'header label - always visible', 'code_arr': 'hidden field', });
lyr_Routes_5.set('fieldLabels', {'FNODE_': 'hidden field', 'TNODE_': 'hidden field', 'LPOLY_': 'hidden field', 'RPOLY_': 'hidden field', 'LONGUEUR': 'hidden field', 'ROUTESA3_': 'hidden field', 'ROUTESA3_I': 'hidden field', 'CODE': 'hidden field', 'FONCTION': 'header label - always visible', });
lyr_Hydrographie_6.set('fieldLabels', {'FNODE_': 'no label', 'TNODE_': 'no label', 'LPOLY_': 'no label', 'RPOLY_': 'no label', 'LENGTH': 'no label', 'HYDROLA3_': 'no label', 'HYDROLA3_I': 'no label', 'CODE': 'no label', 'NOM': 'no label', 'LIBELLE': 'no label', });
lyr_Localit_7.set('fieldLabels', {'ENTITY': 'hidden field', 'LAYER': 'hidden field', 'ELEVATION': 'hidden field', 'THICKNESS': 'hidden field', 'COLOR': 'hidden field', 'NOM': 'header label - always visible', 'NUM_VILLAG': 'hidden field', 'X_UTM': 'header label - always visible', 'Y_UTM': 'header label - always visible', });
lyr_Ecoles_8.set('fieldLabels', {'osm_id': 'hidden field', 'code': 'hidden field', 'Type': 'hidden field', 'Nom': 'header label - always visible', });
lyr_Ecoles_8.on('precompose', function(evt) {
    evt.context.globalCompositeOperation = 'normal';
});