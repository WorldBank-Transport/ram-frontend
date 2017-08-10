'use strict';
import React, { PropTypes as T } from 'react';
import { render } from 'react-dom';
import mapboxgl from 'mapbox-gl';

import config from '../../config';
import { toTimeStr } from '../../utils/utils';

const clone = data => JSON.parse(JSON.stringify(data));

class ResultsMap extends React.Component {
  setupMap () {
    this.popover = null;

    mapboxgl.accessToken = config.mbtoken;
    let { bbox } = this.props;

    this.theMap = new mapboxgl.Map({
      container: this.refs.map,
      style: 'mapbox://styles/mapbox/light-v9'
    });
    this.theMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
    this.theMap.scrollZoom.disable();
    this.theMap.fitBounds(bbox);
    this.theMap.on('load', this.setupData.bind(this));

    this.theMap.on('click', 'eta', e => {
      this.showPopover(e.features[0]);
    });
  }

  showPopover (feature) {
    let popoverContent = document.createElement('div');
    render(<MapPopover
            name={feature.properties.n}
            pop={feature.properties.p}
            popIndName={this.props.popIndName}
            eta={feature.properties.e}
            poiName={this.props.poiName} />, popoverContent);

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

  getPopStops (geojson) {
    let feats = geojson.features;
    let buckets = [1, 2, 3, 4, 5];
    let bucketSize = Math.floor(feats.length / buckets.length);
    let pop = feats.map(f => f.properties.p).sort((a, b) => a - b);

    // Get the pop value to build the buckets. All buckets have the same
    // amount of values.
    buckets = buckets.map(b => pop[b * bucketSize - 1]);

    let stops = buckets.map((b, idx) => ([{zoom: 6, value: b}, (idx + 1) * 5]));
    stops.unshift([{zoom: 6, value: 0}, 1]);

    return stops;
  }

  getCircleRadiusPaintProp (data) {
    return {
      'base': 1,
      'type': 'interval',
      'property': 'p',
      'stops': this.getPopStops(data)
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
    if (this.props.data.fetched) {
      if (this.theMap.getSource('etaData')) {
        return;
      }

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

    if (this.props.poi.fetched) {
      if (this.theMap.getSource('poiData')) {
        return;
      }

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

  render () {
    return (
      <article className='card card--analysis-result scenario-vis'>
        <div className='card__contents'>
          <header className='card__header'>
            <h1 className='card__title'>ETA Visualization</h1>
          </header>

          <figure className='card__media scenario-vis__media'>
            <div className='card__cover scenario-vis__map' ref='map'></div>

            <figcaption className='scenario-vis__legend'>
              <h3>Travel time in minutes</h3>
              <dl>
                <dt>Dark green</dt>
                <dd className='l1'><span>0</span></dd>
                <dt>Soft green</dt>
                <dd className='l2'><span>10</span></dd>
                <dt>Light green</dt>
                <dd className='l3'><span>20</span></dd>
                <dt>Yellow</dt>
                <dd className='l4'><span>30</span></dd>
                <dt>Orange</dt>
                <dd className='l5'><span>60</span></dd>
                <dt>Red</dt>
                <dd className='l6'><span>90</span></dd>
                <dt>Brown</dt>
                <dd className='l7'><span>120</span></dd>
              </dl>
            </figcaption>
          </figure>
        </div>
      </article>
    );
  }
}

ResultsMap.propTypes = {
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
            <h1 className='popover__title'>{this.props.name}</h1>
          </header>
          <div className='popover__body'>
            <p>{this.props.popIndName}: {this.props.pop}</p>
            <p>{toTimeStr(this.props.eta)} to reach nearest poi {this.props.poiName}</p>
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
  poiName: T.string
};
