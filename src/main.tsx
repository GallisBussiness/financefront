import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import App from './App';
import './css/style.css';
import './css/satoshi.css';
import 'jsvectormap/dist/css/jsvectormap.css';
import 'flatpickr/dist/flatpickr.min.css';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/charts/styles.css';
import { PrimeReactProvider } from "primereact/api";

import "primereact/resources/themes/mira/theme.css";
import {
  QueryClient, QueryClientProvider,
} from 'react-query'
import AuthProvider from 'react-auth-kit';
import createStore from 'react-auth-kit/createStore';

const store = createStore({
  authName: import.meta.env.VITE_TOKENSTORAGENAME,
  authType:'localstorage',
  cookieDomain: window.location.hostname,
  cookieSecure: window.location.protocol === 'https:',
});

const pt = {
  datatable: {
      paginator:{
        pageButton(options:any){
          return {className: options?.context.active ? 'bg-blue-400 text-white font-semibold' : undefined}
        },
        root:{className:'bg-blue-100 w-1/2 mx-auto rounded-lg my-2'},
        RPPDropdown: {item:{className: "bg-blue-100"}}
       },
   column: {
    headerCell: { style: {background: "#009BDC"},className:"text-white" },
    bodyCell:{ className:"font-semibold text-sm"}
},
  root: {
    className: "text-green-500",
  },
  
  }
};


import { createTheme, MantineProvider } from '@mantine/core';

const theme = createTheme({

});
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
    <PrimeReactProvider value={{pt}}>
    <QueryClientProvider client={queryClient}>
    <AuthProvider
       store={store}
      >
       <Router>
        <AntdApp>
           <App />
        </AntdApp>
    </Router>
    </AuthProvider>
    </QueryClientProvider>
    </PrimeReactProvider>
    </MantineProvider>
   
  </React.StrictMode>,
);
