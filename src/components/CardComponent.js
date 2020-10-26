import React from "react";
import {
    Card,
    CardContent,
    Typography
} from '@material-ui/core';
import styled from "styled-components";

const StyledCard = styled(Card)`
    width: 20em;
    text-align: center;
    margin: 1em;
    
    && > div {
        padding: 0;
    }

    @media only screen and (max-width: 350px) {
        && {
            width: Calc((100%) - 1em);
        }
    }
`;

const Image = styled("img")`
    margin: 0.5em;
    width: Calc((100%) - 1em);
`;

const Title = styled(Typography)`
    padding-top: 16px;
    border-bottom: 1px solid #E1E1E1;
`;

const Description = styled(Typography)`
    padding: 0 16px 16px;
    border-top: 1px solid #E1E1E1;
`;

export default ({ title, img, description, ...props }) => (
    <StyledCard {...props}>
        <CardContent>
            <Title>{title}</Title>
            <Image src={process.env.PUBLIC_URL + '/img/' + img} alt={title} />
            <Description>{description}</Description>
        </CardContent>
    </StyledCard>
);