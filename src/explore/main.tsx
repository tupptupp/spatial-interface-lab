import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ExploreApp from './ExploreApp';

// Development-only entry (explore.html). It is not part of the production build input.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ExploreApp />
  </StrictMode>,
);
