'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';

import config from '../../../config';
import { t } from '../../../utils/i18n';
import { fetchJSON } from '../../../actions';
import { showGlobalLoading, hideGlobalLoading } from '../../global-loading';

// Cache for the catalog options.
// This could be moved to the global state and passed along using selectors, but
// since this information is only going to be used by this component is
// contained in here.
let catalogOptCache = {};

const CatalogSourceSelect = ({options, selectedOption, onChange, label}) => {
  return (
    <div className='form__group'>
      <label className={c('form__label', {'visually-hidden': !label})} htmlFor='wbc-profile'>{label || t('Catalog option')}</label>
      <select id='wbc-profile' name='wbc-profile' className='form__control' value={selectedOption} onChange={(event) => onChange(event.target.value)}>
        {options.map(option => <option key={`prof-${option.id}`} value={option.id}>{option.value}</option>)}
      </select>
    </div>
  );
};

if (config.environment !== 'production') {
  CatalogSourceSelect.propTypes = {
    options: T.array,
    selectedOption: T.string,
    label: T.string,
    onChange: T.func
  };
}

// The CatalogSource queries the Api for data on mount and caches it locally
// avoiding additional queries when is remounted.
export class CatalogSource extends React.Component {
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
        // Of there are options simulate a change event.
        response.length && this.props.onChange(response[0].key);
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
      <CatalogSourceSelect
        options={options}
        selectedOption={selectedOption}
        onChange={this.props.onChange} />
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

