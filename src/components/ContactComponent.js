import React from "react";
import { Typography, IconButton } from "@mui/material";
import { GitHub, LinkedIn, Mail } from "@mui/icons-material";
import styled from "styled-components";

const Wrapper = styled("div")`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1em;

    && > h2 {
        text-align: center;
        margin-bottom: 1rem;
    }
`;

const BigIconButton = styled(IconButton)`
  font-size: 5em !important;

  &&:hover {
    background-color: #f5f5f5;
  }
`;

export default () => (
  <Wrapper>
    <Typography variant="h2">Contact me</Typography>
    <div>
      <BigIconButton
        variant="contained"
        color="primary"
        href="mailto:ellenlangelaar@gmail.com"
        size="large"
      >
        <Mail fontSize="inherit" />
      </BigIconButton>
      <BigIconButton
        color="primary"
        aria-label="LinkedIn"
        href="http://www.linkedin.com/in/ellenlangelaar"
        target="_blank"
        size="large"
      >
        <LinkedIn fontSize="inherit" />
      </BigIconButton>

      <BigIconButton
        color="primary"
        aria-label="GitHub"
        href="https://github.com/e11en"
        target="_blank"
        size="large"
      >
        <GitHub fontSize="inherit" />
      </BigIconButton>
    </div>
  </Wrapper>
);