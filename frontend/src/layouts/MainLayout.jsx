import React from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Header from '../components/Home/Header/Header'
import Footer from '../components/Home/Footer/Footer'
import CTA from '../components/Home/CTA/CTA'

export default function MainLayout() {
  return (
    <>
      {/* 🔥 Toast Container (Global) */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '10px',
            background: '#1f1f1f',
            color: '#fff',
          },
        }}
      />

      <Header />
      
      <main>
        <Outlet /> 
      </main>

      <CTA />
      <Footer />
    </>
  )
}