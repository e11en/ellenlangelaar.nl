import React from "react";
import { Tooltip  } from "@material-ui/core";
import styled from "styled-components";

const Image = styled("img")`
    width: 4em;
    margin-left: 1em;
`;

export default ({name, img}) => (
    <Tooltip title={name}>
        <Image alt={name} src={process.env.PUBLIC_URL + '/img/skills/' + img} />
    </Tooltip>
);