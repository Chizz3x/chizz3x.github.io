import { createGlobalStyle } from 'styled-components';
import { CSSMediaSize } from './const';

export default createGlobalStyle`
	body {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
			'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
			sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		background-color: var(--c-bg-1);
		color: var(--c-text-1);
	}

	code {
		font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
			monospace;
	}

	:root {
		--c-bg-1: #1a1a1a;
		--c-bg-2: #2a2a2a;
		--c-bg-3: #3a3a3a;
		--c-bg-4: #4a4a4a;
		--c-bg-5: #5a5a5a;
		--c-bg-6: #6a6a6a;
		--c-bg-7: #7a7a7a;
		--c-bg-8: #8a8a8a;
		--c-bg-9: #9a9a9a;
		--c-text-1: #ffffff;
	}

	h1, h2, h3, h4, h5, h6, p {
		margin: 0;
	}

	::-webkit-scrollbar {
		/*width: 8px;*/
		visibility: hidden;
	}
	::-webkit-scrollbar-track {
		background: var(--c-bg-1);
	}
	::-webkit-scrollbar-thumb {
		background: var(--c-text-1);
		border-radius: 4px;
		background-color: var(--c-bg-8);
	}

	${CSSMediaSize.tablet} {
		::-webkit-scrollbar {
			width: 8px;
		}
	}
`;
