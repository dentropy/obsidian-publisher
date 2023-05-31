import React from 'react';
import { useParams } from 'react-router-dom';

const PageRendererIndex = () => {

  // Map the page name to the corresponding HTML file
  const getPagePath = () => {
    return `/pages/index.html`;
  };

  return (
    <div>
      <iframe 
        src={getPagePath()}
        title={"index"}
        style={{
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
        }}
      />
    </div>
  );
};

export default PageRendererIndex;
