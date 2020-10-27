import React from "react";
import { Button, Typography } from "@material-ui/core";
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

export default () => (
    <Wrapper>
        <Typography variant="h2">Contact me</Typography>
        <Button variant="contained" color="primary" href="mailto:info@ellenlangelaar.nl">Send me an e-mail</Button>
    </Wrapper>
);