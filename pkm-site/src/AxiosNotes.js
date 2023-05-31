import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const AxiosNotes = () => {
  const { pageName } = useParams();

  // Map the page name to the corresponding HTML file
  const getPagePath = (pageName) => {
    return `http://localhost:3000/pages/${pageName}.html`;
  };
  console.log(getPagePath(pageName))
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    const fetchHtmlContent = async () => {
      try {
        const response = await axios.get(getPagePath(pageName));
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

export default AxiosNotes;
