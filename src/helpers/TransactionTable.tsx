import React, { useEffect, useReducer, useState } from 'react';
import { channels } from '../shared/constants.js';
import { CategoryDropDown } from '../helpers/CategoryDropDown.tsx';
import { KeywordSave } from '../helpers/KeywordSave.tsx';
import Moment from 'moment';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faEyeSlash, faTrash } from "@fortawesome/free-solid-svg-icons";
import SplitTransactionModal from '../helpers/SplitTransactionModal.tsx';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Pagination from '@mui/material/Pagination';


/*
 TODO:
  - modify description?
  - popup window to add notes, tags, etc and edit item
    https://mui.com/material-ui/react-modal/
  - somehow highlight if we could set a keyword
  - auto select all possible duplicates
*/

interface TransactionNodeData {
  txID: number;
  catID: number; 
  envID: number; 
  category: string;
  envelope: string; 
  accountID: number;  
  account: string;
  txAmt: number;
  txDate: number;
  description: string;
  keywordEnvID: number;
  isDuplicate: number;
  isVisible: number;
  isSplit: number;
}

export const TransactionTable = ({data, envList, callback}) => {  

  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  // Transaction data
  const [txData, setTxData] = useState<TransactionNodeData[]>(data);
  const [isChecked, setIsChecked] = useState<any[]>([]);
  const [isAllChecked, setIsAllChecked] = useState(false);
  
  // Variables for data table paging
  const [pagingCurPage, setPagingCurPage] = useState(1);
  const [pagingPerPage, setPagingPerPage] = useState(50);
  const [pagingNumPages, setPagingNumPages] = useState(1);
  const [pagingTotalRecords, setPagingTotalRecords] = useState(0);


  
  function formatCurrency(currencyNumber:number) {
    return currencyNumber.toLocaleString('en-EN', {style: 'currency', currency: 'USD'});
  }

  const handlePageChange = (event, page: number) => {
    setPagingCurPage(page);
  };

  const handleNumPerPageChange = (event: SelectChangeEvent) => {
    setPagingPerPage(parseInt(event.target.value));
  };

  const set_checkbox_array = (myArr) => {
    // Set our array of checkboxes
    let check_list = myArr.map((item) => {
      return {txID: item.txID, isChecked: false};
    });
    setIsChecked([...check_list]);
  }

  const look_for_dups = () => {
    let filtered_nodes = txData.filter((item, index) => {
      return (index < (pagingCurPage * pagingPerPage) &&
      index >= ((pagingCurPage-1) * pagingPerPage));
    });
    filtered_nodes.forEach((item, index, myArr) => {
      if (myArr.find((item2, index2) => {
        return (item.txID !== item2.txID &&
        item.txAmt === item2.txAmt &&
        item.txDate === item2.txDate &&
        item.description === item2.description &&
        index2 > index);
        })) {
          isChecked.find(n => n.txID === item.txID).isChecked = true;
      }
    });
    setIsChecked([...isChecked]);
  }

  const delete_checked_transactions = () => {

    let filtered_nodes = isChecked.filter((item) => item.isChecked);
    // Signal we want to del data
    const ipcRenderer = (window as any).ipcRenderer;
    ipcRenderer.send(channels.DEL_TX_LIST, {del_tx_list: filtered_nodes});
    
    // Wait till we are done
    ipcRenderer.on(channels.DONE_DEL_TX_LIST, () => {
      setIsAllChecked(false);
      callback();      
      ipcRenderer.removeAllListeners(channels.DONE_DEL_TX_LIST);
    });
    
    // Clean the listener after the component is dismounted
    return () => {
      ipcRenderer.removeAllListeners(channels.DONE_DEL_TX_LIST);
    };
    
  } 
  
  const handleChangeAll = ({id, new_value}) => {
    let filtered_nodes = isChecked.filter((item) => item.isChecked);
    // Signal we want to del data
    const ipcRenderer = (window as any).ipcRenderer;
    ipcRenderer.send(channels.UPDATE_TX_ENV_LIST, [new_value, filtered_nodes]);
    
    // Wait till we are done
    ipcRenderer.on(channels.DONE_DEL_TX_LIST, () => {
      setIsAllChecked(false);
      callback();      
      ipcRenderer.removeAllListeners(channels.DONE_DEL_TX_LIST);
    });
    
    // Clean the listener after the component is dismounted
    return () => {
      ipcRenderer.removeAllListeners(channels.DONE_DEL_TX_LIST);
    };
  }; 
  
  const handleTxEnvChange = ({id, new_value}) => {
    // Request we update the DB
    const ipcRenderer = (window as any).ipcRenderer;
    ipcRenderer.send(channels.UPDATE_TX_ENV, [id, new_value]);
    
    // Wait till we are done
    ipcRenderer.on(channels.DONE_UPDATE_TX_ENV, () => {
      callback();      
      ipcRenderer.removeAllListeners(channels.DONE_UPDATE_TX_ENV);
    });
    
    // Clean the listener after the component is dismounted
    return () => {
      ipcRenderer.removeAllListeners(channels.DONE_UPDATE_TX_ENV);
    };
  };

  const toggleDuplicate = ({txID, isDuplicate}) => {
    // Request we update the DB
    const ipcRenderer = (window as any).ipcRenderer;
    ipcRenderer.send(channels.SET_DUPLICATE, [txID, isDuplicate]);
    
    // Wait till we are done
    ipcRenderer.on(channels.DONE_SET_DUPLICATE, () => {
      callback();      
      ipcRenderer.removeAllListeners(channels.DONE_SET_DUPLICATE);
    });
    
    // Clean the listener after the component is dismounted
    return () => {
      ipcRenderer.removeAllListeners(channels.DONE_SET_DUPLICATE);
    };
  };

  const toggleVisibility = ({txID, isVisible}) => {
    // Request we update the DB
    const ipcRenderer = (window as any).ipcRenderer;
    ipcRenderer.send(channels.SET_VISIBILITY, [txID, isVisible]);
    
    // Wait till we are done
    ipcRenderer.on(channels.DONE_SET_VISIBILITY, () => {
      callback();      
      ipcRenderer.removeAllListeners(channels.DONE_SET_VISIBILITY);
    });
    
    // Clean the listener after the component is dismounted
    return () => {
      ipcRenderer.removeAllListeners(channels.DONE_SET_VISIBILITY);
    };
  };

  useEffect(() => {
    // TODO: Not super happy with this, but it will do for now.
    const oldNumPer = Math.ceil(pagingTotalRecords / pagingNumPages);
    const oldItemIndex = (pagingCurPage-1) * oldNumPer;
    const newItemIndex = Math.ceil(oldItemIndex / pagingPerPage)
    setPagingCurPage(newItemIndex?newItemIndex:1);
    
    setPagingNumPages(Math.ceil(pagingTotalRecords / pagingPerPage));
  }, [pagingPerPage]);
  
  useEffect(() => {
    const numtx = data?.length;
    if (numtx > 0) {
      setPagingTotalRecords(numtx);
      setPagingNumPages(Math.ceil(numtx / pagingPerPage));
    } else {
      setPagingTotalRecords(0);
      setPagingNumPages(1);
    }
    set_checkbox_array(data);
    setTxData([...data]);
  }, [data]);

  useEffect(() => {
    forceUpdate();
  }, [txData]);

  useEffect(() => {
  }, []);


  return (
    <>
    <table className="Table TxTable" cellSpacing={0} cellPadding={0}>
      <thead>
        <tr className="Table THR">
          <th className="Table THR THRC Small">{'Date'}</th>
          <th className="Table THR THRC THRCMed">{'Account'}</th>
          <th className="Table THR THRC">{'Description'}</th>
          <th className="Table THR THRC Small">{'Amount'}</th>
          <th className="Table THR THRC">{'Envelope'}</th>
          <th className="Table THR THRC">{'Split'}</th>
          <th className="Table THR THRC">{' KW '}</th>
          <th className="Table THR THRC">
            <div onClick={() => look_for_dups()}>{' Dup '}</div>
          </th>
          <th className="Table THR THRC">{' Vis '}</th>
          <th className="Table THR THRC">
            <input type="checkbox" onChange={(e) => {
              for(let iter=((pagingCurPage-1) * pagingPerPage); 
                iter < (pagingCurPage * pagingPerPage); iter++) {
                if (isChecked[iter]) {
                  isChecked[iter].isChecked = e.target.checked;
                }
              }
              setIsChecked([...isChecked]);
              setIsAllChecked(e.target.checked);
            }} checked={isAllChecked}/>
          </th>
        </tr>
      </thead>

      <tbody>
        {
        //for (const [index, item] of txData.entries()) {
          txData.map((item, index) => (
            index < (pagingCurPage * pagingPerPage) &&
            index >= ((pagingCurPage-1) * pagingPerPage) &&
            <tr key={index} className={(item.isDuplicate === 1 ? "TR-duplicate":"")}>
              <td className="Table TC">{Moment(item.txDate).format('M/D/YYYY')}</td>
              <td className="Table TC Left">{item.account}</td>
              <td className="Table TC Left">{item.description}</td>
              <td className="Table TC Right">{formatCurrency(item.txAmt)}</td>
              <td className="Table TC TCInput">
                <CategoryDropDown 
                  id={item.txID}
                  envID={item.envID}
                  data={envList}
                  changeCallback={handleTxEnvChange}
                  className={item.envID === -1 ? "envelopeDropDown-undefined":""}
                />
              </td>
              <td className="Table TC">
                <SplitTransactionModal 
                    txID={item.txID}
                    txDate={item.txDate}
                    txAmt={item.txAmt}
                    txDesc={item.description}
                    cat={item.category}
                    env={item.envelope}
                    envID={item.envID}
                    isSplit={item.isSplit}
                    envList={envList}
                    callback={callback}
                  />
              </td>
              <td className="Table TC">
                  <KeywordSave
                    txID={item.txID}
                    envID={item.envID}
                    description={item.description}
                    keywordEnvID={item.keywordEnvID} />
              </td>
              <td className="Table TC">
                <div
                  onClick={() => {
                    toggleDuplicate({txID: item.txID, isDuplicate: (item.isDuplicate?0:1)});
                  }}
                  className={"Toggle" + (item.isDuplicate?" Toggle-active":"")}>
                  <FontAwesomeIcon icon={faCopy} />
                </div>
              </td>
              <td className="Table TC">
                <div
                  onClick={() => {
                    toggleVisibility({txID: item.txID, isVisible: (item.isVisible?0:1)});
                  }}
                  className={"Toggle" + (!item.isVisible?" Toggle-active":"")}>
                  <FontAwesomeIcon icon={faEyeSlash} />
                </div>
              </td>
              <td className="Table TC">
                <input type="checkbox" id={item.txID.toString()} onChange={(e) => {
                  isChecked[index].isChecked = e.target.checked;
                  setIsChecked([...isChecked]);
                }} checked={isChecked[index].isChecked}/>
              </td>
            </tr>
          ))
        //}
        }
      </tbody>
      <tfoot>
        <tr className="Table THR">
          <td className="Table THR THRC TC Right" colSpan={3}>
            (Only filtered data, but including all pages) Total:
          </td>
          <td className="Table THR THRC TC Right">{
            formatCurrency(
              txData.reduce((total, curItem, curIndex) => {
                return total + curItem.txAmt;
              }, 0)
            )
          }</td>
          <td className="Table THR TCInput">
            <CategoryDropDown
                  id={-1}
                  envID={-1}
                  data={envList}
                  changeCallback={handleChangeAll}
                  className="filterEnvelope"
                />
          </td>
          <td className="Table THR THRC" colSpan={4}></td>
          <td className="Table THR THRC">
            <button 
              className='trash'
              onClick={() => delete_checked_transactions()}>
                <FontAwesomeIcon icon={faTrash} />
            </button>
          </td>
        </tr>
      </tfoot>
    </table>
    <div className="PagingContainer"><table ><tbody><tr>
      <td>
      <span>Rows per page:</span>
      
      <Select
        id="dpaging-select-num-per-page"
        value={pagingPerPage.toString()}
        onChange={handleNumPerPageChange}
        sx={{ m:0, p:0, ml:1, lineHeight: 'normal', height: 30 }}
      >
        <MenuItem value={10}>10</MenuItem>
        <MenuItem value={20}>20</MenuItem>
        <MenuItem value={30}>30</MenuItem>
        <MenuItem value={40}>40</MenuItem>
        <MenuItem value={50}>50</MenuItem>
        <MenuItem value={100}>100</MenuItem>
        <MenuItem value={200}>200</MenuItem>
        <MenuItem value={300}>300</MenuItem>
      </Select>
      </td>
      <td >
        <Pagination
          count={pagingNumPages}
          variant="outlined"
          shape="rounded"
          onChange={handlePageChange}
          page={pagingCurPage}
          sx={{ width: 'fit-content'}}
        />
      </td>
      </tr></tbody></table></div>
    </>
  );
};

export default TransactionTable;