// src/pages/AboutUs.jsx
import React from 'react'
import About from '../components/AboutUs/About'
import PageTitle from '../components/AboutUs/PageTitle'
import CorporateJourney from '../components/AboutUs/CorporateJourney'
import Stats from '../components/AboutUs/Stats'
import Team from '../components/AboutUs/Team'
import Statement from '../components/AboutUs/Statement'


export default function AboutUs() {
  return (
    <>
    <PageTitle/>
    <About/>
    <CorporateJourney/>
    <Stats/>
    <Statement/>
    <Team/>
    </>
  )
}
