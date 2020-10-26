import React from "react";
import { Button, Typography } from "@material-ui/core";
import IconButton from '@material-ui/core/IconButton';
import { GitHub, LinkedIn, Create } from '@material-ui/icons';
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
        text-align: center;
        font-weight: 500;
        margin: 1em;
    }
`;

export default () => (
    <Wrapper>
        <div>
            <IconButton color="secondary" aria-label="LinkedIn" href="http://www.linkedin.com/in/ellenlangelaar" target="_blank">
                <LinkedIn />
            </IconButton>

            <IconButton color="secondary" aria-label="GitHub" href="https://github.com/e11en" target="_blank">
                <GitHub />
            </IconButton>

            <IconButton color="secondary" aria-label="GitHub" href="http://blog.ellenlangelaar.nl" target="_blank">
                <Create />
            </IconButton>
        </div>

        <Text>MADE BY ELLEN LANGELAAR © 2020</Text>

        <Button href="privacy-statement" color="secondary" variant="outlined">Privacy Statement</Button>
    </Wrapper>
);