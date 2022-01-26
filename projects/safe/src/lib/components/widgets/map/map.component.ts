import { Apollo } from 'apollo-angular';
import { Component, AfterViewInit, Input, OnDestroy } from '@angular/core';
import 'leaflet.markercluster';

import { Record } from '../../../models/record.model';
import { Subscription } from 'rxjs';
import { QueryBuilderService } from '../../../services/query-builder.service';

import { applyFilters } from './filter';

// Declares L to be able to use Leaflet from CDN
declare let L: any;

const MARKER_OPTIONS = {
  color: '#0090d1',
  opacity: 0.25,
  weight: 12,
  fillColor: '#0090d1',
  fillOpacity: 1,
  radius: 6
};

// Declares an interface that will be used in the cluster markers layers
interface IMarkersLayerValue {
  [name: string]: any;
}

@Component({
  selector: 'safe-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
/*  Map widget using Leaflet.
*/
export class SafeMapComponent implements AfterViewInit, OnDestroy {

  // === MAP ===
  public mapId: string;
  private map: any;
  private southWest = L.latLng(-89.98155760646617, -1000);
  private northEast = L.latLng(89.99346179538875, 1000);
  private bounds = L.latLngBounds(this.southWest, this.northEast);

  // === BASEMAPS ===

  private basemapLayers: any = {
    Streets: 'ArcGIS:Streets',
    Navigation: 'ArcGIS:Navigation',
    Topographic: 'ArcGIS:Topographic',
    'Light Gray': 'ArcGIS:LightGray',
    'Dark Gray': 'ArcGIS:DarkGray',
    'Streets Relief': 'ArcGIS:StreetsRelief',
    Imagery: 'ArcGIS:Imagery',
    ChartedTerritory: 'ArcGIS:ChartedTerritory',
    ColoredPencil: 'ArcGIS:ColoredPencil',
    Nova: 'ArcGIS:Nova',
    Midcentury: 'ArcGIS:Midcentury',
    OSM: 'OSM:Standard',
    'OSM:Streets': 'OSM:Streets'
  };

  private apiKey = 'AAPKf2bae9b3f32943e2a8d58b0b96ffea3fj8Vt8JYDt1omhzN_lONXPRHN8B89umU-pA9t7ze1rfCIiiEVXizYEiFRFiVrl6wg';

  // === MARKERS ===
  private markersLayer: any;
  private markersLayerGroup: any;
  private popupMarker: any;
  private markersCategories: IMarkersLayerValue = [];
  private categoryNames: string[] = [];
  private overlays: IMarkersLayerValue = {};
  private layerControl: any;

  // === RECORDS ===
  private selectedItem: Record | null = null;
  private data: any[] = [];
  private dataQuery: any;
  private dataSubscription?: Subscription;
  private displayFields: string[] = [];

  // === WIDGET CONFIGURATION ===
  @Input() header = true;
  @Input() settings: any = null;

  constructor(
    private apollo: Apollo,
    private queryBuilder: QueryBuilderService
  ) {
    this.mapId = this.generateUniqueId();
  }

  /*  Generation of an unique id for the map ( in case multiple widgets use map ).
  */
  private generateUniqueId(parts: number = 4): string {
    const stringArr: string[] = [];
    for (let i = 0; i < parts; i++) {
      // tslint:disable-next-line:no-bitwise
      const S4 = (((1 + Math.random()) * 0x10000) | 0)
        .toString(16)
        .substring(1);
      stringArr.push(S4);
    }
    return stringArr.join('-');
  }

  /*  Once template is ready, build the map.
  */
  ngAfterViewInit(): void {
    // Calls the function wich draw the map.
    this.drawMap();
    // Gets the settings from the DB.
    if (this.settings.query){
      const builtQuery =  this.queryBuilder.buildQuery(this.settings);
      this.dataQuery = this.apollo.watchQuery<any>({
        query: builtQuery,
        variables: {
          first: 100
        }
      });
      // Handles the settings data and changes the map accordingly.
      this.getData();
    }

    this.displayFields = this.settings.query?.fields.map((f: any) => f.name) || [];

    this.map.setMaxBounds(this.bounds);
    this.map.setZoom(this.settings.zoom);

    setTimeout(() => this.map.invalidateSize(), 100);
  }

  /*  Create the map with all useful parameters
  */
  private drawMap(): void {
    const centerLong = this.settings.centerLong ? Number(this.settings.centerLong) : 0;
    const centerLat = this.settings.centerLat ? Number(this.settings.centerLat) : 0;

    // Defines map
    this.map = L.map(this.mapId, {
      zoomControl: false,
      minZoom: 2,
      maxZoom: 18,
      worldCopyJump: true
    }).setView([centerLat, centerLong], this.settings.zoom || 3);

    // Adds a zoom control
    L.control.zoom({
      position: 'bottomleft'
    }).addTo(this.map);

    // Sets map base
    const apiKey = this.apiKey;
    L.esri.Vector.vectorBasemapLayer(this.basemapLayers[this.settings.mapbase]
      ? this.basemapLayers[this.settings.mapbase]
      : this.basemapLayers.OSM, {
      apiKey
    }).addTo(this.map);

    // Popup at marker click
    this.markersLayerGroup = L.featureGroup().addTo(this.map);
    this.markersLayerGroup.on('click', (event: any) => {
      this.selectedItem = this.data.find(x => x.id === event.layer.options.id);
      this.popupMarker = L.popup({})
        .setLatLng([event.latlng.lat, event.latlng.lng])
        .setContent(this.selectedItem ? this.selectedItem.data : '')
        .addTo(this.map);
    });

    // Adds layer contorl
    this.markersLayer = L.markerClusterGroup({}).addTo(this.markersLayerGroup);

    // Adds searchbar

    const searchControl = L.esri.Geocoding.geosearch({
      position: 'topleft',
      placeholder: 'Enter an address or place e.g. 1 York St',
      useMapBounds: false,
      providers: [L.esri.Geocoding.arcgisOnlineProvider({
        apikey: apiKey,
        nearby: {
          lat: -33.8688,
          lng: 151.2093
        },
      })]
    }).addTo(this.map);

    const results = L.layerGroup().addTo(this.map);

    searchControl.on('results', (data: any) => {
      results.clearLayers();
      for (let i = data.results.length - 1; i >= 0; i--) {
        const lat = Math.round(data.results[i].latlng.lat * 100000) / 100000;
        const lng = Math.round(data.results[i].latlng.lng * 100000) / 100000;
        const marker = L.circleMarker(data.results[i].latlng, MARKER_OPTIONS);
        marker.bindPopup(`
          <p>${data.results[i].properties.ShortLabel}</br>
          <b>${'latitude: '}</b>${lat}</br>
          <b>${'longitude: '}</b>${lng}</p>`);
        results.addLayer(marker);
        marker.openPopup();
      }
    });


  }

  /* Load the data, using widget parameters.
  */
  private getData(): void {
    this.map.closePopup(this.popupMarker);
    this.popupMarker = null;
    const myIcon = L.icon({
      iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.2.0/images/marker-icon.png',
    });

    this.dataSubscription = this.dataQuery.valueChanges.subscribe((res: any) => {
      // Empties all variables used in map
      this.data = [];
      this.categoryNames = [];
      this.markersCategories = [];
      this.selectedItem = null;
      this.markersLayer.clearLayers();
      this.setLayers(res);
    });
  }

  /* Adds each layer to the map.
  */
  private setLayers(res: any): void
  {
    // Removes map layers
    if (this.layerControl) {
      this.layerControl.remove();
    }

    // Loops throught fields to get all custom markers
    for (const field in res.data) {
      if (Object.prototype.hasOwnProperty.call(res.data, field)) {
        res.data[field].edges.map((x: any) => {
          // Gets all markers categories
          if (!this.categoryNames.includes(x.node[this.settings.category])) {
            this.categoryNames.push(x.node[this.settings.category]);
          }
          // Draws all markers
          this.drawMarkers(x.node);
        });
      }
    }

    // Add custom marker categories for each
    if (this.categoryNames.length !== 0) {
      this.categoryNames.map((name: string) => {
        this.overlays[name ? name : 'Markers'] = L.featureGroup.subGroup(
          this.markersLayer,
          this.markersCategories[name]
        ).addTo(this.map);
      });
    }
    else {
        this.overlays.markers = L.featureGroup(
          this.markersLayer
        ).addTo(this.map);
    }

    // Loops throught clorophlets and add them to the map
    if (this.settings.query.clorophlet) {
      this.settings.query.clorophlet.map((value: any) => {
        this.overlays[value.name] = L.geoJson(JSON.parse(value.geoJSON), {style(feature: any): any {
          let color = 'transparent';
          for (const field in res.data) {
            if (Object.prototype.hasOwnProperty.call(res.data, field)) {
              res.data[field].edges.map((entry: any) => {
                if (entry.node[value.place] === feature.properties[value.geoJSONfield]) {
                  value.divisions.map((div: any) => {
                    if (applyFilters(entry.node, div.filter)) {
                      color = div.color;
                    }
                  });
                }
              });
            }
          }

          // if (filter(this.settings))
          return {
              fillColor: color,
              stroke: false,
              fillOpacity: 1
          };
        }}).addTo(this.map);
      });
    }

    // Loops throught online layers and add them to the map
    if (this.settings.onlineLayers) {
      this.settings.onlineLayers.map((layer: any) => {
        this.overlays[layer.title] = L.esri.featureLayer({
          url: layer.url + '/0',
          simplifyFactor: 1,
          apikey: this.apiKey
        });
        this.overlays[layer.title].metadata((error: any) => {
          if (!error) {
            this.overlays[layer.title].addTo(this.map);
          }
          else {
            console.log('Error at loadind "' + layer.title + '"');
            console.log(error);
          }
        });
      });
    }

    // Set ups layer control if more that one layer is added
    if (this.categoryNames.length !== 0 || this.settings.onlineLayers.length !== 0) {
      this.layerControl = L.control.layers(null, this.overlays, {collapsed: true}).addTo(this.map);
    }

  }


  /*  Draw markers on the map if the record has coordinates
  */
  private drawMarkers(item: any): void {
    const latitude = Number(item[this.settings.latitude]);
    const longitude = Number(item[this.settings.longitude]);
    if (!isNaN(latitude) && latitude >= -90 && latitude <= 90) {
      if (!isNaN(longitude) && longitude >= -180 && longitude <= 180) {
        let data = '';
        for (const key of Object.keys(item)) {
          if (this.displayFields.includes(key)) {
            data += `<div><b>${key}:</b> ${item[key]}</div>`;
          }
        }
        const obj = {id: item.id, data};
        this.data.push(obj);
        const options = MARKER_OPTIONS;
        Object.assign(options, {id: item.id});
        const marker = L.circleMarker(
          [
            latitude,
            longitude
          ],
          options);
        if (!this.markersCategories[item[this.settings.category]]) {
          this.markersCategories[item[this.settings.category]] = [];
        }
        this.markersCategories[item[this.settings.category]].push(marker);

      }
    }
  }

  public ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

}
