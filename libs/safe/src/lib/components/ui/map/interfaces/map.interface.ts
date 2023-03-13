/**
 * Map settings for leaflet.
 */
export interface MapConstructorSettings {
  title?: string;
  centerLong: number;
  centerLat: number;
  // maxBounds array of two points [[southWest], [northEast]]
  // e.g. [[-90, -180], [90, 180]]
  maxBounds?: number[][];
  basemap?: string;
  zoomControl?: boolean;
  minZoom?: number;
  maxZoom?: number;
  zoom?: number;
  worldCopyJump?: boolean;
  layers?: any[];
  pm?: any;
  pmIgnore?: boolean;
  timeDimension?: boolean;
  controls?: MapControls;
}

/** Available leaflet event types. */
export enum MapEventType {
  FIRST_LOAD,
  MAP_CHANGE,
  MOVE_END,
  ZOOM_END,
  SELECTED_LAYER,
}

/** Map event interface */
export interface MapEvent {
  type: MapEventType;
  content: any;
}

/** Map controls interface */
export interface MapControls {
  timedimension: boolean;
  download: boolean;
  legend: boolean;
  measure: boolean;
  group: boolean;
  search: boolean;
}

/** Default values for the map controls */
export const DefaultMapControls: MapControls = {
  timedimension: false,
  download: true,
  legend: true,
  measure: false,
  group: true,
  search: false,
};
