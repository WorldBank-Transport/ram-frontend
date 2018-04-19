'use strict';
import React, { PropTypes as T } from 'react';
import c from 'classnames';

import config from '../../../config';

const SourceSelector = ({options, selectedOption, onChange, displayCols}) => {
  return (
    <div className={displayCols ? `form__hascol form__hascol--${displayCols}` : ''}>
      {options.map(({id, name}) => (
        <label key={id} className={c('form__option form__option--custom-radio', {'form__option--inline': !displayCols})}>
          <input type='radio' name='source-type' id={id} value={id} checked={selectedOption === id} onChange={onChange} />
          <span className='form__option__ui'></span>
          <span className='form__option__text'>{name}</span>
        </label>
      ))}
    </div>
  );
};

if (config.environment !== 'production') {
  SourceSelector.propTypes = {
    options: T.array,
    selectedOption: T.string,
    displayCols: T.number,
    onChange: T.func
  };
}

export default SourceSelector;
