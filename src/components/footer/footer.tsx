import React from 'react';
import styled from 'styled-components';

const Footer = () => {
	return (
		<FooterStyle id="footer">
			<div className="socials">
				{/* Social Media Links */}
			</div>
		</FooterStyle>
	);
};

export { Footer };

const FooterStyle = styled.div`
	min-height: 100px;
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 24px;
	.socials {
		display: flex;
		justify-content: center;
	}
`;
