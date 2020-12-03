import React from "react";
import { Typography } from "@material-ui/core";
import styled from "styled-components";
import Masonry from 'react-masonry-component';

import Card from "./CardComponent";

const Wrapper = styled("div")`
    background-color: #f5f5f5;
    padding: 1em;
`;

const Header = styled(Typography)`
    text-align: center;
`;

export default () => (
    <Wrapper>
        <Header variant="h2">Portfolio</Header>

        <Masonry>
            <Card className="card" title="Hack in the Class Foundation" img="hict-advent-2020.png" description="Hack challenge advent calendar, made with React and PHP." />
            <Card className="card" title="Tedas" img="tedas-uniscope-2020.png" description="Command and control platform for security infrastructures." />
            <Card className="card" title="Thinkwise" img="thinkwise-universal-2019.png" description="New user interface for low code applications, made with React." />
            <Card className="card" title="Thinkwise" img="thinkwise-2019.png" description="User interface for low code applications, made with C#." />
            <Card className="card" title="Coding Blog" img="blog-2018.png" description="My personal coding blog, made with Hugo." />
            <Card className="card" title="Anouk Stouten.com" img="anoukstouten-2017.jpg" description="Portfolio site for Anouk Stouten, made with Angular2+." />
            <Card className="card" title="FiftySix Avenue" img="fashionfitr-2016-modelfitr.png" description="A data input system, made with React." />
            <Card className="card" title="FiftySix Avenue" img="fashionfitr-2016-management.png" description="A new design for the management system, made with Bootstrap and Laravel." />
            <Card className="card" title="FiftySix Avenue" img="fashionfitr-2016.png" description="A tool for clothing size calculation." />
            <Card className="card" title="Own project" img="pokemon-2016.png" description="An interactive Pokemon GO map." />
            <Card className="card" title="Quality Centers" img="qualitycenters-2014.png" description="A tool for converting XML to Excel, made with C#." />
            <Card className="card" title="Retail Synergie" img="retailsynergie-2014.png" description="A ticketing system, made with ASP.NET." />
        </Masonry>
    </Wrapper>
);