'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';
import _ from 'lodash';

import config from '../../../config';
import { t } from '../../../utils/i18n';
import { limitHelper } from '../../../utils/utils';
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
      const url = this.props.type === 'road-network'
        ? `${config.api}/scenarios/wbcatalog-source-data`
        : `${config.api}/projects/wbcatalog-source-data`;

      fetchJSON(url, {
        method: 'POST',
        body: JSON.stringify({name: this.props.type})
      })
      .then(response => {
        hideGlobalLoading();
        catalogOptCache[this.props.type] = response;
        this.setState({options: response});
        // Of there are options simulate a change event.
        response.length && this.props.onChange(response[0].id.toString());
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

// The CatalogPoiSource is similar to the CatalogSource but alows for the
// selection of multiple options.
export class CatalogPoiSource extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      options: catalogOptCache.poi || null
    };
  }

  componentDidMount () {
    if (!this.state.options) {
      showGlobalLoading();
      fetchJSON(`${config.api}/scenarios/wbcatalog-source-data`, {
        method: 'POST',
        body: JSON.stringify({name: 'poi'})
      })
      .then(response => {
        hideGlobalLoading();
        catalogOptCache.poi = response;
        this.setState({options: response});
        response.length && this.props.onChange([{
          key: this.state.options[0].id.toString(),
          label: ''
        }]);
      });
    }
  }

  addCatalogSource () {
    let source = _.clone(this.props.selectedOptions);
    source = source.concat({
      key: this.state.options[0].id.toString(),
      label: ''
    });
    this.props.onChange(source);
  }

  onCatalogSourceRemove (idx) {
    let source = _.cloneDeep(this.props.selectedOptions);
    source.splice(idx, 1);
    this.props.onChange(source);
  }

  onCatalogKeyChange (idx, option) {
    let source = _.cloneDeep(this.props.selectedOptions);
    source[idx].key = option;
    this.props.onChange(source);
  }

  onCatalogLabelChange (idx, event) {
    let source = _.cloneDeep(this.props.selectedOptions);
    source[idx].label = event.target.value;
    this.props.onChange(source);
  }

  renderCatalogSources () {
    const { selectedOptions } = this.props;
    const options = this.state.options;

    if (!options) return null; // Is loading.

    if (!options.length) {
      return <p>{t('There are options available in the World Bank Catalog.')}</p>
    }

    const labelLimit = limitHelper(this.props.labelLimitSize);

    return selectedOptions.map((o, i) => {
      const limit = labelLimit(o.label.length);
      return (
        <fieldset className='form__fieldset' key={`${o.key}-${i}`}>
          <div className='form__inner-header'>
            <div className='form__inner-headline'>
              <legend className='form__legend'>{t('Point of interest {idx}', {idx: i + 1})}</legend>
            </div>
            <div className='form__inner-actions'>
              <button type='button' className={c('fia-trash', {disabled: selectedOptions.length <= 1})} title={t('Delete fieldset')} onClick={this.onCatalogSourceRemove.bind(this, i)}><span>{t('Delete')}</span></button>
            </div>
          </div>

          <div className='form__hascol form__hascol--2'>
            <CatalogSourceSelect
              options={options}
              selectedOption={o.key}
              label={t('Catalog option')}
              onChange={this.onCatalogKeyChange.bind(this, i)} />

            <div className='form__group'>
              <label className='form__label' htmlFor={`label-${i}`}>{t('Label')}</label>
              <input type='text' id={`label-${i}`} name={`label-${i}`} className={limit.c('form__control')} value={o.label} onChange={this.onCatalogLabelChange.bind(this, i)} />
              <p className='form__help'>{t('{chars} characters left', {chars: limit.remaining})}</p>
            </div>
          </div>
        </fieldset>
      );
    });
  }

  render () {
    return (
      <div>
        {this.renderCatalogSources()}
        <div className='form__extra-actions'>
          <button type='button' className='fea-plus' title={t('Add new catalog source')} onClick={this.addCatalogSource.bind(this)}><span>{t('New catalog source')}</span></button>
        </div>
      </div>
    );
  }
}

if (config.environment !== 'production') {
  CatalogPoiSource.propTypes = {
    selectedOptions: T.array,
    labelLimitSize: T.number,
    onChange: T.func
  };
}
