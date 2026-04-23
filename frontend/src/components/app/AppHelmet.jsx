import React, { memo } from "react";
import { Helmet } from "react-helmet";

const AppHelmet = memo(() => (
    <>
        <title>MWS IntegraLearn — Emotional Wellness</title>
        <meta name="description" content="MWS IntegraLearn: emotional wellness check-ins, insights, and dashboards." />
        <meta property="og:title" content="MWS IntegraLearn — Emotional Wellness" />
        <meta property="og:description" content="Emotional check-ins, AI insights, and unit dashboards for schools." />
        <meta name="theme-color" content="#8B1C2F" />
    </>
));

AppHelmet.displayName = 'AppHelmet';
export default AppHelmet;
