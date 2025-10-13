# Seismic Ripple Atlas

Seismic Ripple Atlas listens to the live USGS daily earthquake feed and paints each tremor as an animated ripple.
Magnitude determines the band width, depth influences the glow, and story cards capture the freshest details with
links back to the USGS event pages.

## Data Source
- [USGS Earthquake Hazards Program – All Earthquakes, Past Day](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php)

## Refresh Cadence
- The feed is fetched on load and every five minutes thereafter. Error and quiet states are surfaced directly in the UI.
