import React from "react";
import { Button, Typography } from "@mui/material";
import styled from "styled-components";

const Wrapper = styled("div")`
    background-color: black;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #DDD;
    padding: 1em;
`;

const Text = styled(Typography)`
    && {
        font-size: 0.6em;
        text-align: center;
        font-weight: 500;
        margin: 1em;
    }
`;

const FooterComponent = () => (
    <Wrapper>
        <Text>MADE BY ELLEN LANGELAAR © 2024</Text>

        <Button href="privacy-statement" color="secondary" variant="outlined">Privacy Statement</Button>
    </Wrapper>
 );

 export default FooterComponent;