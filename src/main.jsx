/** React entrypoint: mounts the Sentinel/AI application in the root DOM node. */
import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.jsx';
import './style.css';
createRoot(document.getElementById('root')).render(<App/>);
