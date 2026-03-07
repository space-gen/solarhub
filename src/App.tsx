import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import NavigationBar from './components/NavigationBar'
import LoadingScreen from './components/LoadingScreen'

const Home = lazy(() => import('./pages/Home'))
const Classify = lazy(() => import('./pages/Classify'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))

export default function App() {
  return (
    <BrowserRouter basename="/solarhub">
      <NavigationBar />
      <Suspense fallback={<LoadingScreen />}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/classify" element={<Classify />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </BrowserRouter>
  )
}
