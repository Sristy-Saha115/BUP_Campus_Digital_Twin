import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import CampusMap from './pages/CampusMap.jsx';
import BusTracking from './pages/BusTracking.jsx';
import FacultySlots from './pages/FacultySlots.jsx';
import BloodNetwork from './pages/BloodNetwork.jsx';
import ClubEvents from './pages/ClubEvents.jsx';
import Scholarships from './pages/Scholarships.jsx';
import Chatbot from './pages/Chatbot.jsx';
import CampusExplorer from './pages/CampusExplorer.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<CampusMap />} />
          <Route path="/bus" element={<BusTracking />} />
          <Route path="/faculty" element={<FacultySlots />} />
          <Route path="/blood" element={<BloodNetwork />} />
          <Route path="/clubs" element={<ClubEvents />} />
          <Route path="/scholarships" element={<Scholarships />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/explorer" element={<CampusExplorer />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
