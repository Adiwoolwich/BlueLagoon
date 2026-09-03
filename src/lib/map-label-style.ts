import type { ExpressionSpecification, StyleSpecification } from "maplibre-gl";

/** Local OSM name, then German, then Latin. Never English exonyms first. */
const NAME: ExpressionSpecification = [
  "coalesce",
  ["get", "name:de"],
  ["get", "name"],
  ["get", "name:latin"],
];

const HALO = "rgba(0,0,0,0.82)";
const INK = "#f4f4f5";
const MUTED = "#e4e4e7";
const WATER = "#c4d4ee";

/**
 * Labels-only MapLibre style over Esri satellite.
 * OpenFreeMap / OpenMapTiles, no API key. Transparent background.
 */
export const SAT_LABEL_STYLE: StyleSpecification = {
  version: 8,
  name: "bl-sat-labels",
  sources: {
    openmaptiles: {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
    },
  },
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sprite: "https://tiles.openfreemap.org/sprites/ofm_f384/ofm",
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#000000", "background-opacity": 0 },
    },
    {
      id: "waterway-label",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "waterway",
      minzoom: 12,
      layout: {
        "symbol-placement": "line",
        "text-field": NAME,
        "text-font": ["Noto Sans Italic"],
        "text-size": 12,
        "text-max-width": 8,
      },
      paint: {
        "text-color": WATER,
        "text-halo-color": HALO,
        "text-halo-width": 1.2,
      },
    },
    {
      id: "water-name-line",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "water_name",
      minzoom: 11,
      layout: {
        "symbol-placement": "line",
        "text-field": NAME,
        "text-font": ["Noto Sans Italic"],
        "text-size": 13,
        "text-max-width": 8,
        "symbol-spacing": 220,
      },
      paint: {
        "text-color": WATER,
        "text-halo-color": HALO,
        "text-halo-width": 1.3,
      },
    },
    {
      id: "water-name-point",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "water_name",
      minzoom: 12,
      filter: ["match", ["geometry-type"], ["Point", "MultiPoint"], true, false],
      layout: {
        "text-field": NAME,
        "text-font": ["Noto Sans Italic"],
        "text-size": 13,
        "text-max-width": 8,
      },
      paint: {
        "text-color": WATER,
        "text-halo-color": HALO,
        "text-halo-width": 1.3,
      },
    },
    {
      id: "poi-hotel",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "poi",
      minzoom: 15,
      filter: [
        "any",
        ["==", ["get", "class"], "lodging"],
        ["match", ["get", "subclass"], ["hotel", "hostel", "guest_house", "motel", "apartment"], true, false],
      ],
      layout: {
        "icon-image": "lodging",
        "icon-size": 0.85,
        "icon-optional": true,
        "text-field": NAME,
        "text-font": ["Noto Sans Regular"],
        "text-size": 12,
        "text-anchor": "top",
        "text-offset": [0, 0.7],
        "text-optional": false,
        "text-max-width": 9,
        "text-padding": 4,
      },
      paint: {
        "text-color": "#e9d5ff",
        "text-halo-color": HALO,
        "text-halo-width": 1.3,
      },
    },
    {
      id: "road-minor",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "transportation_name",
      minzoom: 14,
      filter: ["match", ["get", "class"], ["minor", "service", "track", "path"], true, false],
      layout: {
        "symbol-placement": "line",
        "text-field": NAME,
        "text-font": ["Noto Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 14, 11, 16, 13, 18, 15],
        "text-rotation-alignment": "map",
        "text-padding": 2,
      },
      paint: {
        "text-color": MUTED,
        "text-halo-color": HALO,
        "text-halo-width": 1.35,
        "text-halo-blur": 0,
      },
    },
    {
      id: "road-major",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "transportation_name",
      minzoom: 11,
      filter: ["match", ["get", "class"], ["primary", "secondary", "tertiary", "trunk", "motorway"], true, false],
      layout: {
        "symbol-placement": "line",
        "text-field": NAME,
        "text-font": ["Noto Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 11, 11, 14, 13, 16, 14],
        "text-rotation-alignment": "map",
      },
      paint: {
        "text-color": INK,
        "text-halo-color": HALO,
        "text-halo-width": 1.4,
        "text-halo-blur": 0,
      },
    },
    {
      id: "place-village",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      minzoom: 9,
      maxzoom: 18,
      filter: ["match", ["get", "class"], ["village", "hamlet", "suburb", "neighbourhood"], true, false],
      layout: {
        "text-field": NAME,
        "text-font": ["Noto Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 9, 11, 13, 13, 15, 14],
        "text-padding": 4,
        "text-max-width": 8,
      },
      paint: {
        "text-color": INK,
        "text-halo-color": HALO,
        "text-halo-width": 1.5,
        "text-halo-blur": 0,
      },
    },
    {
      id: "place-town",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      minzoom: 6,
      maxzoom: 14,
      filter: ["==", ["get", "class"], "town"],
      layout: {
        "text-field": NAME,
        "text-font": ["Noto Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 6, 11, 10, 14, 13, 16],
        "text-padding": 6,
        "text-max-width": 8,
      },
      paint: {
        "text-color": INK,
        "text-halo-color": HALO,
        "text-halo-width": 1.6,
        "text-halo-blur": 0,
      },
    },
    {
      id: "place-city",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      minzoom: 4,
      maxzoom: 13,
      filter: ["==", ["get", "class"], "city"],
      layout: {
        "text-field": NAME,
        "text-font": ["Noto Sans Bold"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 4, 11, 8, 15, 12, 18],
        "text-padding": 8,
        "text-max-width": 8,
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": HALO,
        "text-halo-width": 1.7,
        "text-halo-blur": 0,
      },
    },
  ],
};
