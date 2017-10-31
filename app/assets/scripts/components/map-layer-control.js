'use strict';
import React, { PropTypes as T } from 'react';
import { render } from 'react-dom';

import { t } from '../utils/i18n';

import Dropdown from './dropdown';

// Mapbox Control class.
export default class LayerControl {
  onAdd (map) {
    this.theMap = map;
    this._container = document.createElement('div');
    this._container.className = 'mapboxgl-ctrl';

    render(<LayerControlDropdown
      onLayerChange={this._onLayerChange.bind(this)} />, this._container);

    return this._container;
  }

  onRemove () {
    this._container.parentNode.removeChild(this._container);
    this.theMap = undefined;
  }

  _onLayerChange (layer, active) {
    switch (layer) {
      case 'poi':
        this.theMap.setLayoutProperty('poi', 'visibility', active ? 'visible' : 'none');
        break;
      case 'origins':
        this.theMap.setLayoutProperty('eta', 'visibility', active ? 'visible' : 'none');
        break;
      case 'admin-bounds':
        this.theMap.setLayoutProperty('admin-bounds', 'visibility', active ? 'visible' : 'none');
        break;
      case 'road-network':
        this.theMap.setLayoutProperty('road-network', 'visibility', active ? 'visible' : 'none');
        this.theMap.setLayoutProperty('road-network-cap', 'visibility', active ? 'visible' : 'none');
        break;
      case 'satellite':
        this.theMap.setLayoutProperty('satellite', 'visibility', active ? 'visible' : 'none');
        break;
    }
  }
}

// React component for the layer control.
// It is disconnected from the global state because it needs to be included
// via the mapbox code.
class LayerControlDropdown extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      origins: true,
      poi: true,
      'admin-bounds': true,
      'road-network': true,
      satellite: false
    };
  }

  toggleLayer (what) {
    this.setState({ [what]: !this.state[what] });
    this.props.onLayerChange(what, !this.state[what]);
  }

  render () {
    return (
      <Dropdown
        className='eta-vis__overlays-menu'
        triggerClassName='etavb-overlays'
        triggerActiveClassName='button--active'
        triggerText={t('Map layers')}
        triggerTitle={t('Toggle map layers')}
        direction='down'
        alignment='left' >
          <h6 className='drop__title'>{t('Toggle layers')}</h6>
          <label htmlFor='switch-origins' className='form__option form__option--switch' title={t('Toggle on/off')}>
            <input type='checkbox' name='switch-origins' id='switch-origins' value='on' checked={this.state.origins} onChange={this.toggleLayer.bind(this, 'origins')}/>
            <span className='form__option__text'>{t('Origins')}</span>
            <span className='form__option__ui'></span>
          </label>
          <label htmlFor='switch-poi' className='form__option form__option--switch' title={t('Toggle on/off')}>
            <input type='checkbox' name='switch-poi' id='switch-poi' value='on' checked={this.state.poi} onChange={this.toggleLayer.bind(this, 'poi')}/>
            <span className='form__option__text'>{t('Destinations')}</span>
            <span className='form__option__ui'></span>
          </label>
          <label htmlFor='switch-bounds' className='form__option form__option--switch' title={t('Toggle on/off')}>
            <input type='checkbox' name='switch-bounds' id='switch-bounds' value='on' checked={this.state['admin-bounds']} onChange={this.toggleLayer.bind(this, 'admin-bounds')}/>
            <span className='form__option__text'>{t('Admin boundaries')}</span>
            <span className='form__option__ui'></span>
          </label>
          <label htmlFor='switch-rn' className='form__option form__option--switch' title={t('Toggle on/off')}>
            <input type='checkbox' name='switch-rn' id='switch-rn' value='on' checked={this.state['road-network']} onChange={this.toggleLayer.bind(this, 'road-network')}/>
            <span className='form__option__text'>{t('Road network')}</span>
            <span className='form__option__ui'></span>
          </label>
          <label htmlFor='switch-satellite' className='form__option form__option--switch' title={t('Toggle on/off')}>
            <input type='checkbox' name='switch-satellite' id='switch-satellite' value='on' checked={this.state['satellite']} onChange={this.toggleLayer.bind(this, 'satellite')}/>
            <span className='form__option__text'>{t('Satellite')}</span>
            <span className='form__option__ui'></span>
          </label>
      </Dropdown>
    );
  }
}

LayerControlDropdown.propTypes = {
  onLayerChange: T.func
};
