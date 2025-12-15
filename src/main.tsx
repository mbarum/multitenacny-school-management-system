
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { DataProvider } from './contexts/DataContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
