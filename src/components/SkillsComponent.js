import React from "react";
import { Typography } from "@mui/material";
import styled from "styled-components";
import Skill from "./SkillComponent";

const Wrapper = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1em;
  background-color: #f5f5f5;

  && > h2 {
    text-align: center;
    margin-bottom: 1rem;
  }
`;

const Skills = styled("div")`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
`;

const SkillsComponent = () => (
  <Wrapper>
    <Typography variant="h2">Skills</Typography>
    <Skills>
      <Skill name="Agile" img="agile.png" />
      <Skill name="CSS" img="css.png" />
      <Skill name="Docker" img="docker.png" />
      <Skill name=".Net" img="dot-net.png" />
      <Skill name="Git" img="git.png" />
      <Skill name="React" img="react.png" />
      <Skill name="Typescript" img="typescript.png" />
      <Skill name="Laravel" img="laravel.png" />
      <Skill name="Linux" img="linux.png" />
      <Skill name="MongoDB" img="mongodb.png" />
      <Skill name="PHP" img="php.png" />
      <Skill name="Azure" img="azure.png" />
      <Skill name="SQL" img="sql.png" />
      <Skill name="UFT" img="uft.png" />
    </Skills>
  </Wrapper>
 );

 export default SkillsComponent;