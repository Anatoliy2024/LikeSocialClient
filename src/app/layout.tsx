import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import "@/styles/reset.scss"
// import Header from "@/components/header/Header"
// import Navbar from "@/components/navbar/Navbar"
// import Footer from "@/components/footer/Footer"

import ReduxProvider from "@/providers/ReduxProvider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Like Social",
  description: "Generated by create next app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  )
}

// Назначение	Цвет	HEX
// Фон	Светло-сиреневый	#F3E8FF
// Основной	Твой фиолет	#6400B9
// Вторичный	Нежно-фиолетовый	#A366FF
// Акценты	Лимонно-жёлтый	#FFD700
// Текст	Тёмно-серый	#1E1E1E
