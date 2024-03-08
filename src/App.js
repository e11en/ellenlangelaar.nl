import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import HomePage from "./pages/HomePage";
import PrivacyStatementPage from "./pages/PrivacyStatementPage";

const theme = createTheme({
  palette: {
    primary: {
      main: "#d78b9b",
      contrastText: "#fff",
    },
    secondary: {
      main: "#ddd",
      contrastText: "#000",
    },
  },
});

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <Routes>
          <Route exact path="/" element={<HomePage/>} />
          <Route
            exact
            path="/privacy-statement"
            element={<PrivacyStatementPage/>}
          />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
