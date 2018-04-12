'use strict';
import React, { PropTypes as T } from 'react';

import config from '../../../config';

const SourceSelector = ({options, selectedOption, onChange}) => {
  return (
    <div>
      {options.map(({id, name}) => (
        <label key={id} className='form__option form__option--inline form__option--custom-radio'>
          <input type='radio' name='source-type' id={id} value={id} checked={selectedOption === id} onChange={onChange} />
          <span className='form__option__text'>{name}</span>
          <span className='form__option__ui'></span>
        </label>
      ))}
    </div>
  );
};

if (config.environment !== 'production') {
  SourceSelector.propTypes = {
    options: T.array,
    selectedOption: T.string,
    onChange: T.func
  };
}

export default SourceSelector;
