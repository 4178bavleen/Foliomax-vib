import React from 'react'
import Banner from '../components/Home/Banner/Banner.jsx'
import Calculator from '../components/Home/Calculator/Calculator.jsx'
import ChooseUs from '../components/Home/ChooseUs/ChooseUs.jsx'
import WhatWeOffer from '../components/Home/WhatWeOffer/WhatWeOffer.jsx'
import PayoutSystem from '../components/Home/PayoutSystem/PayoutSystem.jsx'
import About from '../components/Home/About/About.jsx'
import FAQ from '../components/Home/FAQ/FAQ.jsx'
// import PopularPair from '../components/Home/PopularPair/PopularPair.jsx'
import Testimonial from '../components/Home/Testimonial/Testimonial.jsx'
// import TVideo from '../components/Home/TVedio/TVedio.jsx'
import FloatingWhatsApp from '../components/FloatingWhatsApp.jsx'
import PopularStocks from '../components/Home/PopularStocks/PopularStocks.jsx'
import Nifty50FullChart from '../components/Nifty50/Nifty50FullChart.jsx'

export default function Home() {
  return (
    <>
      <Banner />
      <WhatWeOffer/>
      <About/>
      <Calculator/>
      {/* <PopularPair/> */}
      <Nifty50FullChart/>
      <PopularStocks/>
      <PayoutSystem/>
      <ChooseUs/>
      <Testimonial/>
      {/* <TVideo/> */}
      <FAQ/>
      {/* Add other sections here: <About />, <Features />, etc. */}
      <FloatingWhatsApp/>
    </>
  )
}
