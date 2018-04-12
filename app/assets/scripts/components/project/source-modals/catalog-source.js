'use strict';
import React, { PropTypes as T } from 'react';

import config from '../../../config';
import { t } from '../../../utils/i18n';
import { fetchJSON } from '../../../actions';
import { showGlobalLoading, hideGlobalLoading } from '../../global-loading';

let catalogOptCache = {};

class CatalogSource extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      options: catalogOptCache[props.type] || null
    };
  }

  componentDidMount () {
    if (!this.state.options) {
      showGlobalLoading();
      fetchJSON(`${config.api}/projects/setup-options`, {
        method: 'POST',
        body: JSON.stringify({name: this.props.type})
      })
      .then(response => {
        hideGlobalLoading();
        catalogOptCache[this.props.type] = response;
        this.setState({options: response});
      });
    }
  }

  render () {
    const { selectedOption } = this.props;
    const options = this.state.options;

    if (!options) return null; // Is loading.

    if (!options.length) {
      return <p>{t('There are options available in the World Bank Catalog.')}</p>
    }

    return (
      <div className='form__group'>
        <label className='form__label visually-hidden' htmlFor='wbc-profile'>{t('Catalog option')}</label>
        <select id='wbc-profile' name='wbc-profile' className='form__control' value={selectedOption} onChange={this.props.onChange}>
          <option value=''>{t('Choose option')}</option>
          {options.map(option => <option key={`prof-${option.id}`} value={option.id}>{option.value}</option>)}
        </select>
      </div>
    );
  }
}

if (config.environment !== 'production') {
  CatalogSource.propTypes = {
    type: T.string,
    selectedOption: T.string,
    onChange: T.func
  };
}

export default CatalogSource;
