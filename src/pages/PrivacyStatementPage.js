import React from "react";
import styled from "styled-components";
import { Button } from "@material-ui/core";

const Wrapper = styled("div")`
    padding: 1em;
`;

export default () => (
    <Wrapper>
        <Button href="/" color="primary" variant="outlined">Back</Button>

        <h1>Verklaring over privacy en cookies</h1>

        <h3>Privacy wetgeving – de ”cookiewet”</h3>
        <p>Zoals hieronder beschreven staat in de officiële verklaring die Google Analytics gebruikers op hun website moeten plaatsen maakt deze website gebruik van Google Analytics. Dit programma levert belangrijke statistieken over aantallen bezoekers, de bezochte pagina’s, de verkeersbronnen en andere essentiële informatie waarmee wij deze website voortdurend kunnen verbeteren voor de gebruikers. Deze statistieken zijn anoniem en niet te herleiden tot een bepaalde persoon of gebruiker. Er wordt geen gebruik gemaakt van zogenaamde ‘behavioural targeting’ waarmee op basis van uw klikgedrag een profiel wordt opgebouwd. Uw surfgedrag blijft volledig anoniem.</p>

        <p>Google Analytics maakt gebruik van een cookie, dat is een klein bestandje dat op uw computer wordt opgeslagen. In de nieuwe privacy wetgeving (januari 2015) valt Google Analytics onder de uitzonderingen en mogen Analytics cookies geplaatst worden zonder toestemming vooraf van de gebruiker, mits Analytics op de juiste manier is ingesteld en wordt voldaan aan de plicht om bezoekers van de website hierover te informeren. Dat doen wij op deze pagina.</p>

        <h3>Privacy instellingen van Google Analytics</h3>
        <p>Volgens de Telecomwetgeving die in januari 2015 is aangenomen valt Google Analytics onder de uitzonderingen omdat dit cookie “geen of slechts geringe” inbreuk op de privacy maakt. Daarnaast is het cookie van Google Analytics een ‘first party cookie, dat wil zeggen dat het cookie op uw computer ‘ellenlangelaar.nl'’ in de bestandsnaam heeft en dat de gegevens officieel eigendom zijn van EllenLangelaar.nl en niet van Google. Dit cookie wordt niet gebruikt voor advertenties of andere commerciële doeleinden.</p>

        <p>Naast de Telecomwet is ook de Wet Bescherming Persoonsgegevens van toepassing. Het gebruik van Google Analytics is ook binnen deze wet toegestaan, mits het op de juiste manier wordt ingesteld. Het gaat daarbij om vier belangrijke voorwaarden. (1) Er is een bewerkersovereenkomst tussen Hayona (de eigenaar van EllenLangelaar.nl) en Google over de Analytics gegevens. (2) IP-adressen worden anoniem zijn gemaakt zodat gegevens nooit naar u of uw IP adres te herleiden zijn. (3) Het Analytics account van EllenLangelaar.nl is zo ingesteld dat de informatie niet met anderen gedeeld mag worden. (4) De bezoeker wordt duidelijk geïnformeerd over het gebruik van Analytics en de mogelijkheid voor een ‘opt-out’.</p>

        <p>EllenLangelaar.nl voldoet hiermee aan alle wettelijke voorwaarden. Het Analytics cookie blijft 6 maanden geldig.</p>

        <h3>Geen andere cookies</h3>
        <p>Op EllenLangelaar.nl worden naast het Analytics cookie geen andere cookies gebruikt.</p>

        <h3>Opt-out voor Google Analytics</h3>
        <p>Als u het script van Analytics liever helemaal wilt blokkeren dan kunt u hier een opt-out plugin voor Google Analytics downloaden: https://tools.google.com/dlpage/gaoptout. Met deze plugin telt uw bezoek niet meer mee in de statistieken van alle websites die Google Analytics gebruiken.</p>

        <h3>Google privacy statement</h3>
        <p>Deze website maakt gebruik van Google Analytics, een webanalyse-service die wordt aangeboden door Google Inc. (“Google”). Google Analytics maakt gebruik van “cookies” (tekstbestandjes die op Uw computer worden geplaatst) om de website te helpen analyseren hoe gebruikers de site gebruiken. De door het cookie gegenereerde informatie over uw gebruik van de website (In het geval van EllenLangelaar.nl zonder uw IP-adres) wordt overgebracht naar en door Google opgeslagen op servers in de Verenigde Staten. Google gebruikt deze informatie om bij te houden hoe u deze website gebruikt, rapporten over de website-activiteit op te stellen voor de eigenaar van deze website (Hayona BV) en andere diensten aan te bieden met betrekking tot website-activiteit en internetgebruik. Google mag deze informatie alleen aan derden verschaffen indien Google hiertoe wettelijk wordt verplicht, of voor zover deze derden de informatie namens Google verwerken. Google zal Uw IP-adres niet combineren met andere gegevens waarover Google beschikt. U kunt het gebruik van cookies weigeren door in Uw browser de daarvoor geëigende instellingen te kiezen. Wij wijzen u er echter op dat u in dat geval wellicht niet alle mogelijkheden van deze website kunt benutten. Door gebruik te maken van deze website geeft u toestemming voor het verwerken van de informatie door Google op de wijze en voor de doeleinden zoals hiervoor omschreven.</p>
    </Wrapper>
);