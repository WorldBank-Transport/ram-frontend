## Setting up a project
Every project needs 5 different inputs to calculate accessibility for a region:

1. [administrative boundaries](#/en/help#administrative-boundaries)
2. [population data](#/en/help#population-data)
3. [points of interest](#/en/help#points-of-interest)
4. [road network](#/en/help#road-network)
5. [OSRM profile](#/en/help#profile)

These files need to be compatible with each other. This means - for example - that the population data, road network and POI all need to fit within the administrative boundaries, or that the OSRM profile specifies travel speeds for road types that in the road network file.

----

### Administrative Boundaries
The administrative boundaries are the units of analysis for which RRA generates the results. The backend expects a GeoJSON with one or more polygons, which can overlap. The latter is useful to benchmark results for, for example, municipalities against the results of the bigger province.

__File requirements__:

  - a GeoJSON file with administrative boundaries
  - features need to be a polygon
  - each feature needs a property `name` (string)

The administrative boundaries are defined on project level and are available across all its scenarios.

### Population data
The population data is used as the origin in the analysis. These are typically population centers like villages.

__File requirements__:

  - a GeoJSON file with village and population data
  - features need to be points
  - each feature needs the following properties:
    - `name` (string)
    - `population`. This needs to be an integer, or a string that can be parsed into an integer.

The origins are defined on a project level. Each scenario uses the same set of origins.

### Points of interest
Points of Interest are used as the destination in the analysis. When multiple POI categories (eg. schools and clinics) are added to a project, the application will calculate an ETA per category for each origin. POI data can be added by uploading a GeoJSON file, or importing it from OpenStreetMap.

If the POI data contains lines or polygons, they will be converted to a point.

#### OSM import
This option imports POI data from OpenStreetMap for the selected categories. It is not possible to customize the OSM tags that get imported for each category. The file upload allows for a more fine-grained control over the POI data.

<dl class="dl-horizontal">
  <dt>Education Facilities</dt>
    <dd>`amenity=school`</dd>
    <dd>`amenity=kindergarten`</dd>
    <dd>`amenity=college`</dd>
    <dd>`amenity=university`</dd>
  <dt>Health Facilities</dt>
    <dd>`amenity=clinic`</dd>
    <dd>`amenity=doctors`</dd>
    <dd>`amenity=hospital`</dd>
  <dt>Financial institutions</dt>
    <dd>amenity=atm</dd>
    <dd>amenity=bank</dd>
    <dd>amenity=bureau_de_change</dd>
    <dd>amenity=money_transfer</dd>
    <dd>amenity=payment_center</dd>
</dl>

#### File upload
For each POI category, a separate GeoJSON file needs to be uploaded. All the POI data in the file gets labeled as a single category.

__File requirements__:

  - a single GeoJSON for each POI category

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
