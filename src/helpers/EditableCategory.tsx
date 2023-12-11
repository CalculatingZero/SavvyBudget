import React, { useState } from 'react';
import { EditText } from 'react-edit-text';
import 'react-edit-text/dist/index.css';
import { channels } from '../shared/constants.js'

export const EditableCategory = ({ initialID, initialName}) => {
  const [id, ] = useState(initialID);
  const [name, setName] = useState(initialName);

  const handleChange = (e, setFn) => {
    setFn(e.target.value);
  };

  const handleCatBlur = () => {
    
    let tmpName = name;

    if (name === 'Income') {
      setName('Income 2');
      tmpName = 'Income 2'; 
    }
    if (name === 'Uncategorized') {
      setName('Uncategorized 2');
      tmpName = 'Uncategorized 2';
    }
    
    // Request we rename the category in the DB
    const ipcRenderer = (window as any).ipcRenderer;
    ipcRenderer.send(channels.REN_CATEGORY, { id, tmpName });
  };

  return (
    <EditText
      name={id}
      defaultValue={name}
      value={name}
      onChange={(e) => handleChange(e, setName)}
      onBlur={handleCatBlur}
      className="category"
      inputClassName="" />
  );
};

export default EditableCategory;