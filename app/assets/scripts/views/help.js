'use strict';
import React from 'react';
import { hashHistory } from 'react-router';
import _ from 'lodash';

import { t, getLanguage } from '../utils/i18n';
import content from '../../content/content.json';

const Help = React.createClass({
  render: function () {
    let data = _.get(content, ['help', getLanguage()], null);
    if (!data) {
      return hashHistory.push(`/${getLanguage()}/404`);
    }

    return (
      <section className='inpage inpage--single'>
        <header className='inpage__header'>
          <div className='inner'>
            <div className='inpage__headline'>
              <h1 className='inpage__title'>{t('Help')}</h1>
            </div>
          </div>
        </header>
        <div className='inpage__body'>
          <div className='inner'>
            <div className='prose prose--responsive' dangerouslySetInnerHTML={{__html: data.body}} />
          </div>
        </div>
      </section>
    );
  }
});

// /////////////////////////////////////////////////////////////////// //
// Connect functions

export default Help;
