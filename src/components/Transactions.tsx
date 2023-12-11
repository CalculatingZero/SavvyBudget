import React, { useEffect, useState } from 'react';
import { Header } from './header.tsx';
import { channels } from '../shared/constants.js'
import { MonthSelector } from '../helpers/MonthSelector.tsx'
import Moment from 'moment';


export const Transactions: React.FC = () => {
  
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
  }
  
  function formatCurrency(currencyNumber:number) {
    return currencyNumber.toLocaleString('en-EN', {style: 'currency', currency: 'USD'});
  }

  const [txData, setTxData] = useState<TransactionNodeData[]>([]);
  const [myStartMonth, setMyStartMonth] = useState(0);
  const [myCurMonth, setMyCurMonth] = useState(0);
  const [year, setYear] = useState((new Date()).getFullYear());
  const [month, setMonth] = useState((new Date()).getMonth());
  const [curMonth, setCurMonth] = useState(Moment(new Date(year, month)).format('YYYY-MM-DD'));
  
  const monthSelectorCallback = ({ childStartMonth, childCurMonth }) => {    
    // Need to adjust our month/year to reflect the change
    let tmpDate = new Date(year, month + childStartMonth + childCurMonth - myCurMonth);
        
    setMyStartMonth(childStartMonth);
    setMyCurMonth(childCurMonth);
    setYear(tmpDate.getFullYear());
    setMonth(tmpDate.getMonth());
    setCurMonth(Moment(tmpDate).format('YYYY-MM-DD'));
  }

  const load_transactions = () => {
    // Signal we want to get data
    const ipcRenderer = (window as any).ipcRenderer;
    ipcRenderer.send(channels.GET_TX_DATA);

    // Receive the data
    ipcRenderer.on(channels.LIST_TX_DATA, (arg) => {
      setTxData(arg as TransactionNodeData[]);
      ipcRenderer.removeAllListeners(channels.LIST_TX_DATA);
    });

    // Clean the listener after the component is dismounted
    return () => {
      ipcRenderer.removeAllListeners(channels.LIST_TX_DATA);
    };
  }

  useEffect(() => {
    load_transactions();
  }, [curMonth]);

  return (
    <div className="App">
      <header className="App-header">
        {<Header />}
      </header>
      <div>
        Transactions<br/>
        <MonthSelector numMonths="10" startMonth={myStartMonth} curMonth={myCurMonth} parentCallback={monthSelectorCallback} />
        <br/>
        <br/>
        {txData?.length > 0 &&
          <table className="TransactionTable" cellSpacing={0} cellPadding={0}>
            <>
              <thead className="TransactionTableHeader">
                <tr className="TransactionTableHeaderRow">
                  <th className="TransactionTableHeaderCell">{' \n '}</th>
                  <th className="TransactionTableHeaderCell">{' \nDate'}</th>
                  <th className="TransactionTableHeaderCellCurr">{'Description'}</th>
                  <th className="TransactionTableHeaderCellCurr">{'Amount'}</th>
                  <th className="TransactionTableHeaderCellCurr">{'Envelope'}</th>
                  <th className="TransactionTableHeaderCell">{' \n '}</th>
                </tr>
              </thead>
    
              <tbody className="TransactionTableBody">
                {txData.map((item, index, myArray) => (
                  <>
                  <tr key={item.envID} className="TransactionTableRow">
                    <td className="TransactionTableCellCurr">&nbsp;</td>
                    <td className="TransactionTableCell">{item.txDate}</td>
                    <td className="TransactionTableCell">{item.description}</td>
                    <td className="TransactionTableCellCurr">{formatCurrency(item.txAmt)}</td>
                    <td className="TransactionTableCell">{item.category + ":" + item.envelope}</td>
                    <td className="TransactionTableCellCurr">&nbsp;</td>
                  </tr>
                  </>
                ))}
              </tbody>
            </>
          </table>
        }
      </div>
    </div>
  );
}