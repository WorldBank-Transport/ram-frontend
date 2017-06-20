'use strict';
import React, { PropTypes as T } from 'react';
import mapboxgl from 'mapbox-gl';

import config from '../../config';

class ResultsMap extends React.Component {
  setupMap () {
    this.dataAdded = false;
    mapboxgl.accessToken = config.mbtoken;
    let { bbox } = this.props;

    this.theMap = new mapboxgl.Map({
      container: this.refs.map,
      style: 'mapbox://styles/mapbox/light-v9'
    });
    this.theMap.addControl(new mapboxgl.NavigationControl(), 'top-left');
    this.theMap.scrollZoom.disable();
    this.theMap.fitBounds(bbox);
    this.theMap.on('load', this.setupData.bind(this));
  }

  setupData () {
    if (!this.dataAdded && this.theMap.loaded() && this.props.data.fetched) {
      this.dataAdded = true;
      this.theMap.addLayer({
        'id': 'eta',
        'type': 'circle',
        'source': {
          type: 'geojson',
          data: this.props.data.data.geojson
        },
        'paint': {
          'circle-color': {
            'base': 1,
            'type': 'interval',
            'property': 'e-0',
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
          'circle-radius': {
            'base': 1,
            'type': 'interval',
            'property': 'pn-0',
            'stops': [
              [{zoom: 0, value: 0}, 2],
              [{zoom: 0, value: 1}, 5],
              [{zoom: 6, value: 0}, 5],
              [{zoom: 6, value: 1}, 25],
              [{zoom: 14, value: 0}, 15],
              [{zoom: 14, value: 1}, 45]
            ]
          },
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
  }

  componentDidMount () {
    if (this.props.bbox) this.setupMap();
  }

  componentWillUnmount () {
    if (this.theMap) {
      this.theMap.remove();
    }
  }

  componentDidUpdate () {
    this.setupData();
  }

  render () {
    return (
      <div>
        <h2 className='inpage__section-title'>ETA Visualization</h2>
        <section ref='map' className='map-wrapper card--analysis-result' />
        <div id='legend'>
          <div id='legendETA'>
            <h3>Travel time in minutes</h3>
            <ul>
              <li className='l1'><span>0</span></li>
              <li className='l2'><span>10</span></li>
              <li className='l3'><span>20</span></li>
              <li className='l4'><span>30</span></li>
              <li className='l5'><span>60</span></li>
              <li className='l6'><span>90</span></li>
              <li className='l7'><span>120</span></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

ResultsMap.propTypes = {
  bbox: T.array,
  data: T.object
};

export default ResultsMap;
