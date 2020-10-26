import React from "react";
import { Typography } from "@material-ui/core";
import styled from "styled-components";
import ReactTypingEffect from 'react-typing-effect';

const Header = styled("div")`
    background-image: url(../img/header.png);
    background-size: cover;
    position: relative;
    background-position: center center;
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const Logo = styled("img")`
    width: 10em;
    height: 10em;
    opacity: .9;
    margin-bottom: 1em;
`;

const Text = styled(Typography)`
    && {
        color: #ffffff;
        font-weight: 900;
        text-align: center;
    }

    @media only screen and (max-width: 900px) {
        && {
            font-size: 1.75rem;
        }
    }
`;


export default () => (
    <Header>
        <Logo src={process.env.PUBLIC_URL + '/img/ellenlangelaar.png'} alt="Ellen Langelaar Logo" />
        <Text variant="h2">Hi, I am Ellen. I create</Text>
        <Text variant="h2">
            <ReactTypingEffect typingDelay={100} eraseDelay={100} 
            text={["applications.",
                    "back-end systems.",
                    "micro services.",
                    "custom solutions.",
                    "databases.",
                    "web applications.",
                    "desktop applications."]}/>
        </Text>
    </Header>
);