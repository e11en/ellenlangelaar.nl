import React from "react";

import Header from "../components/HeaderComponent";
import Contact from "../components/ContactComponent";
import Portfolio from "../components/PortfolioComponent";
import Skills from "../components/SkillsComponent";
import Footer from "../components/FooterComponent";

export default () => (
    <React.Fragment>
        <Header />

        <Contact />

        <Portfolio />

        <Skills />

        <Footer />
    </React.Fragment>
);