import React, { useState, lazy, Suspense } from "react";
import "./App.scss";
import "./pages/AssortmentPage.scss";
import { Modal } from "./components/Modal/Modal";
import { Login } from "./components/Login/Login";
import { RegistrationForm } from "./components/Auth/RegistrationForm";
import { Header } from "./components/Header/Header";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Footer } from "./components/Footer/Footer";
import { clearSession, getSession } from "./utils/session";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute/ProtectedRoute";
import { PageContainer } from "./components/UI/PageContainer/PageContainer";

// ✅ Lazy loading для страниц (уменьшает начальный bundle)
const MainPage = lazy(() => import("./pages/MainPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PublicProfilePage = lazy(() => import("./pages/PublicProfilePage"));
const ReviewPage = lazy(() => import("./pages/ReviewPage"));
const CreatorPage = lazy(() => import("./pages/CreatorPage"));
const AssortmentPage = lazy(() => import("./pages/AssortmentPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const OfertaPage = lazy(() => import("./pages/OfertaPage"));

// Loading компонент
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '24px',
    color: '#667eea'
  }}>
    Загрузка...
  </div>
);

function App() {
  const [loginModalActive, setLoginModalActive] = useState(false);
  const [registerModalActive, setRegisterModalActive] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!getSession()?.accessToken
  );
  const location = useLocation();

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    clearSession();
    setIsAuthenticated(false);
    window.location.reload();
  };

  const openLogin = () => {
    setRegisterModalActive(false);
    setLoginModalActive(true);
  };

  const openRegister = () => {
    setLoginModalActive(false);
    setRegisterModalActive(true);
  };

  const isPublicProfile = location.pathname.startsWith("/profile/") && location.pathname !== "/profile";
  const hideHeaderFooter = isPublicProfile;

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        {!hideHeaderFooter ? (
          <PageContainer>
            <Header
              onLoginClick={openLogin}
              onRegisterClick={openRegister}
              onLogout={handleLogout}
              isAuthenticated={isAuthenticated}
            />
            <Routes>
              <Route path="/" element={<MainPage />} />
              <Route path="/creator" element={<CreatorPage />} />
              <Route path="/editor/:publicId/creator" element={<CreatorPage />} />
              <Route path="/reviews" element={<ReviewPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/oferta" element={<OfertaPage />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/range"
                element={
                  <AssortmentPage
                    isAuthenticated={isAuthenticated}
                    onLoginRequest={openLogin}
                    onRegisterRequest={openRegister}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Footer />
          </PageContainer>
        ) : (
          <Routes>
            <Route
              path="/profile/:userId"
              element={<PublicProfilePage />}
            />
            {/* Fallback for other routes if needed, though hideHeaderFooter logic mostly isolates profile/:userId */}
          </Routes>
        )}
      </Suspense>

      <Modal active={loginModalActive} setActive={setLoginModalActive}>
        <Login
          onClose={() => setLoginModalActive(false)}
          onSuccess={handleLoginSuccess}
        />
      </Modal>
      <Modal active={registerModalActive} setActive={setRegisterModalActive}>
        <RegistrationForm onClose={() => setRegisterModalActive(false)} />
      </Modal>
    </ErrorBoundary>
  );
}

export default function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
