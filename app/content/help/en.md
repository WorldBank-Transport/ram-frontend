## Setting up a project
Every project needs 5 different inputs to calculate accessibility for a region:

1. [administrative boundaries](#/en/help#administrative-boundaries)
2. [population data](#/en/help#population-data)
3. [points of interest](#/en/help#points-of-interest)
4. [road network](#/en/help#road-network)
5. [OSRM profile](#/en/help#profile)

These files need to be compatible with each other. This means - for example - that the population data, road network and POI all need to fit within the administrative boundaries, or that the OSRM profile specifies travel speeds for road types that in the road network file.

### Administrative Boundaries
The administrative boundaries are the units of analysis for which RRA generates the results. The backend expects a geojson with one or more polygons, which can overlap. The latter is useful to benchmark results for, for example, municipalities against the results of the bigger province.

__File requirements__:

  - a geojson file with administrative boundaries
  - features need to be a polygon. Anything that's not a polygon, gets discarded in the current version
  - each feature needs a property `name` (string)

The administrative boundaries are defined on project level and are available across all its scenarios.

### Population data
The population data is used as the origin in the analysis. These are typically population centers like villages.

__File requirements__:

  - a geosjon file with village and population data
  - features need to be points
  - each feature needs the following properties:
    - `name` (string)
    - `population`. This needs to be an integer, or a string that can be parsed into an integer.

The origins are defined on a project level. Each scenario uses the same set of origins.

### Points of interest
The Points of Interest are used as the destination in the analysis.

__File requirements__:

  - a single geosjon file with points of interest
  - features need to be points

POI are defined on a project level. Each scenario uses the same set of POI.

### Road Network
The road network needs to be a valid [OSM XML](http://wiki.openstreetmap.org/wiki/OSM_XML) file that is routable.

__File requirements__:

  - a valid OSM XML file. To speed up the processing, provide a file that only contains the relevant roads.

A different road network can be uploaded for each scenario.

### Profile
The OSRM Profile contains the configuration for the routing, most importantly the speeds per road type.

__File requirements__:

  - a lua file with the [OSRM profile](https://github.com/Project-OSRM/osrm-backend/wiki/Profiles)
