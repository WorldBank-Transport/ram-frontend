'use strict';
import React, { PropTypes as T } from 'react';
import { render } from 'react-dom';
import mapboxgl from 'mapbox-gl';

import config from '../../config';
import { toTimeStr } from '../../utils/utils';

import LayerControl from '../map-layer-control';

const clone = data => JSON.parse(JSON.stringify(data));

class ResultsMap extends React.Component {
  setupMap () {
    this.popover = null;

    mapboxgl.accessToken = config.mbtoken;
    let { bbox } = this.props;

    this.theMap = new mapboxgl.Map({
      container: this.refs.map,
      style: 'mapbox://styles/mapbox/light-v9',
      attributionControl: false
    });
    this.theMap.addControl(new mapboxgl.AttributionControl(), 'bottom-right');
    this.theMap.scrollZoom.disable();
    this.theMap.fitBounds(bbox);
    this.theMap.on('load', this.setupData.bind(this));

    this.theMap.on('click', 'eta', e => {
      this.showPopover(e.features[0]);
    });

    this.theMap.addControl(new mapboxgl.NavigationControl(), 'top-left');

    // Disable map rotation using right click + drag.
    this.theMap.dragRotate.disable();

    // Disable map rotation using touch rotation gesture.
    this.theMap.touchZoomRotate.disableRotation();

    // Remove compass.
    document.querySelector('.mapboxgl-ctrl .mapboxgl-ctrl-compass').remove();

    this.theMap.addControl(new LayerControl(), 'top-left');
  }

  onPopoverCloseClick () {
    this.popover.remove();
  }

  showPopover (feature) {
    let popoverContent = document.createElement('div');

    render(<MapPopover
            name={feature.properties.n}
            pop={feature.properties.p}
            popIndName={this.props.popIndName}
            eta={feature.properties.e}
            poiName={this.props.poiName}
            onCloseClick={this.onPopoverCloseClick.bind(this)} />, popoverContent);

    // Populate the popup and set its coordinates
    // based on the feature found.
    if (this.popover != null) {
      this.popover.remove();
    }

    this.popover = new mapboxgl.Popup({closeButton: false})
      .setLngLat(feature.geometry.coordinates)
      .setDOMContent(popoverContent)
      .addTo(this.theMap);
  }

  getPopBuckets (geojson) {
    const feats = geojson.features;
    const totalBuckets = 5;
    const bucketSize = Math.floor(feats.length / totalBuckets);
    const pop = feats.map(f => f.properties.p).sort((a, b) => a - b);

    let buckets;
    if (pop.length < 5) {
      buckets = [0].concat(pop);
    } else {
      // Prepare the buckets array.
      // Get the pop value to build the buckets. All buckets have the same
      // amount of values.
      buckets = Array.apply(null, Array(totalBuckets - 1)).map((_, i) => pop[(i + 1) * bucketSize - 1]);

      // Add first and last values as well.
      buckets.unshift(0);
      buckets.push(pop[pop.length - 1]);
    }

    return buckets;
  }

  getCircleRadiusPaintProp (data) {
    let buckets = this.getPopBuckets(data);
    // Last value is not needed.
    buckets.pop();
    // Start from the last to account for less than 5 buckets.
    buckets.reverse();

    let stops = buckets.map((b, idx) => ([{zoom: 6, value: b}, (5 - idx) * 4]));
    // Reverse to ensure ascending order.
    stops.reverse();

    return {
      'base': 1,
      'type': 'interval',
      'property': 'p',
      'stops': stops
      // 'stops': [
      //   [{zoom: 0, value: 0}, 2],
      //   [{zoom: 0, value: 1}, 5],
      //   [{zoom: 6, value: 0}, 5],
      //   [{zoom: 6, value: 1}, 25],
      //   [{zoom: 14, value: 0}, 15],
      //   [{zoom: 14, value: 1}, 45]
      // ]
    };
  }

  setupData () {
    if (!this.theMap.getSource('admin-bounds')) {
      this.theMap.addSource('admin-bounds', {
        type: 'vector',
        tiles: [`${config.api}/projects/${this.props.projectId}/tiles/admin-bounds/{z}/{x}/{y}`]
      });
      this.theMap.addLayer({
        id: 'admin-bounds',
        type: 'line',
        source: 'admin-bounds',
        'source-layer': 'bounds',
        layout: {
          visibility: 'none'
        },
        paint: {
          'line-color': '#526980',
          'line-width': 2,
          'line-opacity': 0.48
        }
      });
    }

    if (this.props.data.fetched && !this.theMap.getSource('etaData')) {
      this.theMap.addSource('etaData', {
        'type': 'geojson',
        'data': clone(this.props.data.data.geojson)
      });

      this.theMap.addLayer({
        'id': 'eta',
        'type': 'circle',
        'source': 'etaData',
        'paint': {
          'circle-color': {
            'base': 1,
            'type': 'interval',
            'property': 'e',
            'stops': [
              [0, '#1a9850'],
              [600, '#91cf60'],
              [1200, '#d9ef8b'],
              [1800, '#fee08b'],
              [3600, '#fc8d59'],
              [5400, '#d73027'],
              [7200, '#4d4d4d']
            ]
          },
          'circle-radius': this.getCircleRadiusPaintProp(this.props.data.data.geojson),
          'circle-blur': 0.5,
          'circle-opacity': {
            'stops': [
              [0, 0.1],
              [6, 0.5],
              [12, 0.75],
              [16, 0.9]
            ]
          }
        }
      }, 'poi');
    }

    if (this.props.poi.fetched && !this.theMap.getSource('poiData')) {
      this.theMap.addSource('poiData', {
        type: 'geojson',
        data: clone(this.props.poi.data.geojson)
      });
      this.theMap.addLayer({
        id: 'poi',
        type: 'symbol',
        source: 'poiData',
        layout: {
          'icon-image': 'marker-15'
        }
      });
    }
  }

  componentDidMount () {
    if (this.props.bbox) this.setupMap();
  }

  componentWillUnmount () {
    if (this.theMap) {
      this.theMap.remove();
    }
  }

  componentDidUpdate (prevProps) {
    if (this.props.data.fetched && this.props.data.receivedAt !== prevProps.data.receivedAt) {
      let source = this.theMap.getSource('etaData');
      if (source) {
        source.setData(clone(this.props.data.data.geojson));
        this.theMap.setPaintProperty('eta', 'circle-radius', this.getCircleRadiusPaintProp(this.props.data.data.geojson));
      } else {
        this.setupData();
      }
    }

    if (this.props.poi.fetched && this.props.poi.receivedAt !== prevProps.poi.receivedAt) {
      let source = this.theMap.getSource('poiData');
      if (source) {
        source.setData(clone(this.props.poi.data.geojson));
      } else {
        this.setupData();
      }
    }
  }

  renderPopLegend () {
    const data = this.props.data.data.geojson;
    if (!data) {
      return null;
    }

    const shorten = (num) => {
      if (num >= 1e6) {
        return Math.floor(num / 1e6) + 'M';
      } else if (num >= 1e3) {
        return Math.floor(num / 1e3) + 'K';
      } else {
        return num;
      }
    };

    let stops = this.getPopBuckets(data);
    // Build the legend
    let legend = [];
    stops.forEach((s, idx, all) => {
      // Skip idx 0.
      if (idx) {
        const from = all[idx - 1];
        const to = all[idx];
        const r = idx * 4;

        let scale = ['xs', 's', 'm', 'l', 'xl'];
        if (stops.length < 6) {
          // Cut the scale when it's not big enough.
          scale = scale.slice(scale.length - stops.length + 1);
        }

        legend.push(<dt key={`dt-${r}`} className={`bucket bucket--${scale[idx - 1]}`} title={`${from} - ${to}`}>{r}px radius</dt>);
        legend.push(<dd key={`dd-${r}`} title={`${from} - ${to}`}>{shorten(from)}-{shorten(to)}</dd>);
      }
    });

    return (
      <div className='legend__block'>
        <h3 className='legend__title'>Population size</h3>
        <dl className='legend__dl legend__dl--size'>
          {legend}
        </dl>
      </div>
    );
  }

  renderTimeLegend () {
    return (
      <div className='legend__block'>
        <h3 className='legend__title'>Time to POI <small>(minutes)</small></h3>
        <dl className='legend__dl legend__dl--colors'>
          <dt>Dark green</dt>
          <dd>0-10</dd>
          <dt>Soft green</dt>
          <dd>10-20</dd>
          <dt>Light green</dt>
          <dd>20-30</dd>
          <dt>Yellow</dt>
          <dd>30-60</dd>
          <dt>Orange</dt>
          <dd>60-90</dd>
          <dt>Red</dt>
          <dd>90-120</dd>
          <dt>Brown</dt>
          <dd>+120</dd>
        </dl>
      </div>
    );
  }

  render () {
    return (
      <article className='card card--analysis-result eta-vis'>
        <div className='card__contents'>
          <header className='card__header'>
            <h1 className='card__title'>ETA visualization</h1>
          </header>

          <figure className='card__media eta-vis__media'>
            <div className='card__cover eta-vis__map' ref='map'></div>
            <figcaption className='eta-vis__legend legend'>
              {this.renderPopLegend()}
              {this.renderTimeLegend()}
            </figcaption>
          </figure>
        </div>
      </article>
    );
  }
}

ResultsMap.propTypes = {
  projectId: T.number,
  scenarioId: T.number,
  bbox: T.array,
  data: T.object,
  poi: T.object,
  poiName: T.string,
  popIndName: T.string
};

export default ResultsMap;

class MapPopover extends React.Component {
  render () {
    return (
      <article className='popover'>
        <div className='popover__contents'>
          <header className='popover__header'>
            <div className='popover__headline'>
              <h1 className='popover__title'>{this.props.name}</h1>
            </div>
            <div className='popover__actions actions'>
              <ul className='actions__menu'>
                <li><button type='button' className='actions__menu-item poa-xmark' title='Close popover' onClick={this.props.onCloseClick}><span>Dismiss</span></button></li>
              </ul>
            </div>
          </header>
          <div className='popover__body'>
            <dl className='dl-horizontal popover__details'>
              <dt>{this.props.popIndName}</dt>
              <dd>{this.props.pop}</dd>
              <dt>Nearest POI</dt>
              <dd>{toTimeStr(this.props.eta)}</dd>
            </dl>
          </div>
        </div>
      </article>
    );
  }
}

MapPopover.propTypes = {
  name: T.string,
  pop: T.number,
  popIndName: T.string,
  eta: T.number,
  poiName: T.string,
  onCloseClick: T.func
};
