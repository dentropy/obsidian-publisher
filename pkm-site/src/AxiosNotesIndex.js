import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AxiosNotesIndex = () => {

  // Map the page name to the corresponding HTML file
  const getPagePath = () => {
    return `http://localhost:3000/pages/index.html`;
  };
  console.log(getPagePath())
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    const fetchHtmlContent = async () => {
      try {
        const response = await axios.get(getPagePath());
        setHtmlContent(response.data);
      } catch (error) {
        console.error('Error fetching HTML content:', error);
      }
    };

    fetchHtmlContent();
  }, []);

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: htmlContent }}></div>
    </div>
  );
};

export default AxiosNotesIndex;
