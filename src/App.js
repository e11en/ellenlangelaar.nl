import React from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

import HomePage from "./pages/HomePage";
import PrivacyStatementPage from "./pages/PrivacyStatementPage";

const theme = createMuiTheme({
  palette: {
    primary: {
      main: "#d78b9b",
      contrastText: '#fff'
    },
    secondary: {
      main: "#ddd",
      contrastText: '#000'
    }
  },
});

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <Switch>
            <Route exact path="/" component={HomePage} />
            <Route exact path="/privacy-statement" component={PrivacyStatementPage} />
        </Switch>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
