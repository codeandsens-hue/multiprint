import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import ClientLogos from './components/ClientLogos.jsx'
import Footer from './components/Footer.jsx'
import Navbar from './components/Navbar.jsx'
import PageViewTracker from './components/PageViewTracker.jsx'
import ScrollManager from './components/ScrollManager.jsx'
import AboutPage from './pages/AboutPage.jsx'
import ContactPage from './pages/ContactPage.jsx'
import HomePage from './pages/HomePage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
import ProductsPage from './pages/ProductsPage.jsx'

// The dashboard is loaded only when /admin is opened, so visitors never download it
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'))

// Shared frame for every public page
function Layout() {
  const { pathname } = useLocation()

  return (
    <>
      <ScrollManager />
      <PageViewTracker />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <ClientLogos />
      {/* The contact page has its own large map */}
      <Footer showMap={pathname !== '/contact'} />
    </>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      <Route
        path="admin/*"
        element={
          <Suspense fallback={<div className="admin-loading">Loading dashboard…</div>}>
            <AdminApp />
          </Suspense>
        }
      />
    </Routes>
  )
}

export default App
