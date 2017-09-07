'use strict';
import React, { PropTypes as T } from 'react';
import { render } from 'react-dom';

import { t } from '../utils/i18n';

import Dropdown from './dropdown';

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
    }
  }
}

class LayerControlDropdown extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      origins: true,
      poi: true,
      'admin-bounds': false,
      'road-network': false
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
          <label htmlFor='switch1' className='form__option form__option--switch' title={t('Toggle on/off')}>
            <input type='checkbox' name='switch1' id='switch1' value='on' checked={this.state.origins} onChange={this.toggleLayer.bind(this, 'origins')}/>
            <span className='form__option__text'>{t('Origins')}</span>
            <span className='form__option__ui'></span>
          </label>
          <label htmlFor='switch2' className='form__option form__option--switch' title={t('Toggle on/off')}>
            <input type='checkbox' name='switch2' id='switch2' value='on' checked={this.state.poi} onChange={this.toggleLayer.bind(this, 'poi')}/>
            <span className='form__option__text'>{t('Destinations')}</span>
            <span className='form__option__ui'></span>
          </label>
          <label htmlFor='switch3' className='form__option form__option--switch' title={t('Toggle on/off')}>
            <input type='checkbox' name='switch3' id='switch3' value='on' checked={this.state['admin-bounds']} onChange={this.toggleLayer.bind(this, 'admin-bounds')}/>
            <span className='form__option__text'>{t('Admin boundaries')}</span>
            <span className='form__option__ui'></span>
          </label>
          <label htmlFor='switch4' className='form__option form__option--switch' title={t('Toggle on/off')}>
            <input type='checkbox' name='switch4' id='switch4' value='on' checked={this.state['road-network']} onChange={this.toggleLayer.bind(this, 'road-network')}/>
            <span className='form__option__text'>{t('Road network')}</span>
            <span className='form__option__ui'></span>
          </label>
      </Dropdown>
    );
  }
}

LayerControlDropdown.propTypes = {
  onLayerChange: T.func
};
