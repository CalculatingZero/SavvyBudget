// configure.tsx

import React, { useEffect, useState } from 'react';
import { Header } from './header.tsx';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTrash } from "@fortawesome/free-solid-svg-icons"
import { DragDropContext, Draggable } from "react-beautiful-dnd"
import { StrictModeDroppable as Droppable } from '../helpers/StrictModeDroppable.js';
import NewCategory from '../helpers/NewCategory.tsx';
import EditableCategory from '../helpers/EditableCategory.tsx';
import EditableEnvelope from '../helpers/EditableEnvelope.tsx';
import NewEnvelope from '../helpers/NewEnvelope.tsx';
import { channels } from '../shared/constants.js';
import { CategoryDropDown } from '../helpers/CategoryDropDown.tsx';

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';


export const Configure: React.FC = () => {

  interface EnvelopeList {
    envID: number; 
    category: string;
    envelope: string; 
  }

  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            <Typography>{children}</Typography>
          </Box>
        )}
      </div>
    );
  }

  function a11yProps(index: number) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  const [catData, setCatData] = useState<any[]>([]);
  const [keywordData, setKeywordData] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [value, setValue] = useState(0);
  const [envList, setEnvList] = useState<EnvelopeList[]>([]);
  const [envListLoaded, setEnvListLoaded] = useState(false);
  

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const categoryGroupBy = (data, key, label) => {
    return data.reduce(function(acc, item) {
      let groupKey = item[key];
      let groupLabel = item[label];
      if (!acc[groupKey]) {
        acc[groupKey] = {catID:groupKey, cat:groupLabel, items:[]};
      }
      acc[groupKey].items.push(item);
      return acc;
    }, {});
  };

  const compareCategory = (a,b) => {
    if (a.cat === 'Uncategorized' || b.cat === 'Uncategorized') {
      if (a.cat === 'Uncategorized' && b.cat !== 'Uncategorized') {
        return -1;
      }
      if (a.cat !== 'Uncategorized' && b.cat === 'Uncategorized') {
        return 1;
      }
      return 0;
    } else if (a.cat === 'Income' || b.cat === 'Income') {
      if (a.cat === 'Income' && b.cat !== 'Income') {
        return -1;
      }
      if (a.cat !== 'Income' && b.cat === 'Income') {
        return 1;
      }
      return 0;
    } else {
      if (a.cat < b.cat) {
        return -1;
      }
      if (a.cat > b.cat) {
        return 1;
      }
      return 0;
    }
  }

  const handleCategoryDelete = (id, name) => {
    if (name === 'Income') {
      return;
    }
    if (name === 'Uncategorized') {
      return;
    }

    // Request we delete the category in the DB
    const ipcRenderer = (window as any).ipcRenderer;
    ipcRenderer.send(channels.DEL_CATEGORY, id);
  };

  const handleEnvelopeDelete = (id) => {
    console.log('del envelope: ', id);
    
    // Request we delete the category in the DB
    const ipcRenderer = (window as any).ipcRenderer;
    ipcRenderer.send(channels.DEL_ENVELOPE, id);

    // TODO: Anything we need to clean up here?
  };

  const handleKeywordDelete = (id) => {
    // Request we delete the keyword in the DB
    const ipcRenderer = (window as any).ipcRenderer;
    ipcRenderer.send(channels.DEL_KEYWORD, {id});
  };

  const handleEnvelopeChange = ({id, new_value}) => {
    console.log("handleChange: updating keyword's envelope");
    
    // Request we update the DB
    const ipcRenderer = (window as any).ipcRenderer;
    ipcRenderer.send(channels.UPDATE_KEYWORD_ENV, {id, new_value});
  };

  const handleOnDragEnd = (result) => {
    if (!result?.destination) return;
    
    console.log("result:", result);
    console.log("src:",result.source);
    console.log("dest:",result.destination);

    if (result.source.droppableId !== result.destination.droppableId) {
      
      // Request we move the envelope in the DB
      const ipcRenderer = (window as any).ipcRenderer;
      ipcRenderer.send(channels.MOV_ENVELOPE,  [result.draggableId, result.destination.droppableId] );
    }
  };

  const load_cats_and_envs = () => {
    // Signal we want to get data
    const ipcRenderer = (window as any).ipcRenderer;
    ipcRenderer.send(channels.GET_CAT_ENV);

    // Receive the data
    ipcRenderer.on(channels.LIST_CAT_ENV, (arg) => {
      const groupedData = categoryGroupBy(arg, 'catID', 'category');
      const sortedData = Object.values(groupedData).sort(compareCategory);

      setCatData(sortedData);
      setLoaded(true);

      ipcRenderer.removeAllListeners(channels.LIST_CAT_ENV);
    });

    // Clean the listener after the component is dismounted
    return () => {
      ipcRenderer.removeAllListeners(channels.LIST_CAT_ENV);
    };
  }

  const load_keywords = () => {
    // Signal we want to get data
    const ipcRenderer = (window as any).ipcRenderer;
    ipcRenderer.send(channels.GET_KEYWORDS);

    // Receive the data
    ipcRenderer.on(channels.LIST_KEYWORDS, (arg) => {
      setKeywordData(arg);
      ipcRenderer.removeAllListeners(channels.LIST_KEYWORDS);
    });

    // Clean the listener after the component is dismounted
    return () => {
      ipcRenderer.removeAllListeners(channels.LIST_KEYWORDS);
    };
  }

  const load_envelope_list = () => {
    // Signal we want to get data
    const ipcRenderer = (window as any).ipcRenderer;
    ipcRenderer.send(channels.GET_ENV_LIST);

    // Receive the data
    ipcRenderer.on(channels.LIST_ENV_LIST, (arg) => {
      setEnvList(arg as EnvelopeList[]);
      setEnvListLoaded(true);
      ipcRenderer.removeAllListeners(channels.LIST_ENV_LIST);
    });

    // Clean the listener after the component is dismounted
    return () => {
      ipcRenderer.removeAllListeners(channels.LIST_ENV_LIST);
    };
  }

  useEffect(() => {
    if (!loaded) {
      load_cats_and_envs();
      load_envelope_list();
      load_keywords();
    }
  }, []);

  let category_content;
  if (catData) {
    category_content = (
      <DragDropContext onDragEnd={handleOnDragEnd}>
        {catData.map((category, index) => {
          const { catID, cat:cat_name, items } = category;
          
          return (
            <Droppable droppableId={catID.toString()} key={"cat"+catID.toString()}>
              {(provided) => (
                <section  {...provided.droppableProps} ref={provided.innerRef}>
                  <article className="category-container">
                    <article
                      className={
                        cat_name === 'Income'?'category-item-income':
                        cat_name === 'Uncategorized'?'category-item-uncategorized':
                        'category-item'}>
                      <div className="category">
                        {(cat_name === 'Income' || cat_name === 'Uncategorized')?
                          <div className="category">{cat_name}</div>
                          :
                          <EditableCategory
                            initialID={catID}
                            initialName={cat_name} />
                        }
                      </div>
                      <NewEnvelope id={catID} />
                      {(cat_name !== 'Income' && cat_name !== 'Uncategorized')?
                        <button 
                          className={(cat_name === 'Income' || cat_name === 'Uncategorized')?'trash-block':'trash'}
                          onClick={() => handleCategoryDelete( catID, cat_name )}>
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                        :''
                      }
                    </article>
                    
                    <article className="envelope-container">
                    {
                      items.map((env, index2) => {
                        //console.log("env:", env);  
                        return (
                          (env.envID) &&
                          <Draggable key={env.envID.toString()} draggableId={env.envID.toString()} index={index2}>
                            {(provided) => (
                              <article className="envelope-item-container" {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef}>
                                <article className="envelope-item">
                                  <div className="envelope">
                                    <EditableEnvelope
                                      initialID={env.envID.toString()}
                                      initialName={env.envelope} />
                                  </div>
                                  <button className="trash" onClick={() => handleEnvelopeDelete( env.envID )}>
                                      <FontAwesomeIcon icon={faTrash} />
                                  </button>
                                </article>
                              </article>
                          )}
                          </Draggable>
                        )
                      })
                    }
                    </article>
                  </article>
                  { provided.placeholder }
                </section>
              )}
            </Droppable>
          );
        })}   
      </DragDropContext>
    )
  }

  let keyword_content;
  if (keywordData && envListLoaded) {
    keyword_content = (
      
      <table className="TransactionTable" cellSpacing={0} cellPadding={0}>
        <>
        <thead className="TransactionTableHeader">
          <tr className="TransactionTableHeaderRow">
            <th className="TransactionTableHeaderCell">{'Keyword'}</th>
            <th className="TransactionTableHeaderCell">{'Envelope'}</th>
            <th className="TransactionTableHeaderCell">{' '}</th>
          </tr>
        </thead>

        <tbody className="TransactionTableBody">
          {
            keywordData.map((kw, index) => {
              const { id, envelopeID, description } = kw;
            
                return (
              
                  <>
                  <tr key={id} className="TransactionTableRow">
                    
                    <td className="TransactionTableCell">{description}</td>
                    <td className="TransactionTableCell">
                      <CategoryDropDown 
                        id={id}
                        envID={envelopeID}
                        data={envList}
                        changeCallback={handleEnvelopeChange}
                      />
                    </td>
                    <td className="TransactionTableCell">
                    <button 
                      className='trash'
                      onClick={() => handleKeywordDelete(id)}>
                        <FontAwesomeIcon icon={faTrash} />
                    </button>
                    </td>
                  </tr>
                  </>

                );
            }
          )}
      
        </tbody>
        </>
      </table>
    )
  }

  return (
    <div className="App">
      <header className="App-header">
        {<Header />}
      </header>
      <div>
        Configure<br/>
        
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs  value={value} onChange={handleTabChange}  aria-label="basic tabs example">
              <Tab label="Categories" {...a11yProps(0)} />
              <Tab label="Key Words" {...a11yProps(1)} />
              <Tab label="Accounts" {...a11yProps(2)} />
            </Tabs>
          </Box>
          <CustomTabPanel value={value} index={0}>
            <NewCategory/>      
            {category_content}
          </CustomTabPanel>
          <CustomTabPanel value={value} index={1}>
            {keyword_content}
          </CustomTabPanel>
          <CustomTabPanel value={value} index={2}>
            Item Three
          </CustomTabPanel>
        </Box>
        
      </div>
    </div>
  );
};
