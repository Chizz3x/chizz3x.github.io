import React from 'react';
import ReactDOM from 'react-dom/client';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { BrowserRouter } from 'react-router-dom';
import Index from './pages';
import GlobalStyle from './style';

// Change toast color
const toastStyle: React.CSSProperties = {
	background: 'default',
};

const root = ReactDOM.createRoot(
	document.getElementById('root') as HTMLElement,
);

root.render(
	<React.StrictMode>
		<GlobalStyle />
		<ToastContainer
			toastStyle={toastStyle}
			position="bottom-left"
		/>
		<BrowserRouter>
			<Index />
		</BrowserRouter>
	</React.StrictMode>,
);
