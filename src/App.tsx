import React from "react";
import styled from "styled-components";

import "./App.css";
import { useLocation, useNavigate } from "react-router-dom";

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [ isProper, setIsProper ] = React.useState(false);

  React.useEffect(() => {
    if(location.search.startsWith("?/")) {
      navigate(location.search.slice(1));
    }
    setIsProper(true);
  }, []);

  if(!isProper) return null;

  return (
    <AppStyle className="App"></AppStyle>
  );
};

export default App;

const AppStyle = styled.div``;
