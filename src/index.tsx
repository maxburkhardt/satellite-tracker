import React from 'react';
import ReactDOM from 'react-dom';
import TrackerContainer from './containers/TrackerContainer';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(<TrackerContainer/>, document.getElementById('root'));
serviceWorker.register();
