import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import AuthOutlet from '@auth-kit/react-router/AuthOutlet'
import Loader from './common/Loader';
import PageTitle from './components/PageTitle';
import SignIn from './pages/Authentication/SignIn';
import Finance from './pages/Dashboard/Finance';
import P404 from './pages/P404';
import Credits from './pages/Dashboard/Credits';
import Settings from './pages/Dashboard/Settings';
import Bordereaus from './pages/Dashboard/Bordereaus';
import Engagement from './pages/Dashboard/Engagement';
import EngagementList from './pages/Dashboard/EngagementList';
import Versements from './pages/Versements';
import Versement from './pages/Dashboard/Versement';
import Gestions from './pages/Dashboard/Gestions';
import ChangePassword from './pages/Dashboard/ChangePassword';

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return loading ? (
    <Loader />
  ) : (
    <>
      <Routes>
        <Route
          index
          element={
            <>
              <PageTitle title="Se Connecter" />
              <SignIn />
            </>
          }
        />
        
        <Route
          path="/auth/signin"
          element={
            <>
              <PageTitle title="Se Connecter" />
              <SignIn />
            </>
          }
        />
      <Route element={<AuthOutlet fallbackPath='/auth/signin' />}>
      <Route
          path="/dashboard/*"
          element={
            <>
              <PageTitle title="Finance Crousz" />
              <Finance />
            </>
          }
        >
          <Route
          index
          element={
            <>
              <PageTitle title="GESTION BUDGET" />
             <Gestions />
            </>
          }
        />
         <Route
         path='finance'
          element={
            <>
              <PageTitle title="GESTION BUDGET" />
             <Gestions />
            </>
          }
        />
         <Route
          path='credits'
          element={
            <>
              <PageTitle title="Credits" />
             <Credits />
            </>
          }
        />
         <Route
          path='bordereau'
          element={
            <>
              <PageTitle title="Bordereaux" />
             <Bordereaus />
            </>
          }
        />
         <Route
          path='engagement'
          element={
            <>
              <PageTitle title="Engagements" />
             <EngagementList />
            </>
          }
        />
         <Route
          path='engagement/:id'
          element={
            <>
              <PageTitle title="Engagement" />
             <Engagement />
            </>
          }
        />
         <Route
          path='versement'
          element={
            <>
              <PageTitle title="Versements" />
             <Versements />
            </>
          }
        />
         <Route
          path='versement/:id'
          element={
            <>
              <PageTitle title="Versement" />
             <Versement />
            </>
          }
        />
        <Route
          path='settings'
          element={
            <>
              <PageTitle title="Parametrage" />
              <Settings />
            </>
          }
        />
        <Route
          path='user/:id'
          element={
            <>
              <PageTitle title="Utilisateur" />
             <ChangePassword />
            </>
          }
        />
    </Route>
    </Route>
    <Route
          path="*"
          element={
            <>
              <PageTitle title="Page Non Trouve" />
              <P404 />
            </>
          }
        />
      </Routes>
    </>
  );
}

export default App;
