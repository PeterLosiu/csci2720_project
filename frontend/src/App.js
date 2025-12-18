import ReactDOM from 'react-dom/client';
import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useParams, useLocation } from 'react-router-dom';

// Importing web pages from /pages directory 
import Home from './pages/HomePage';
// import LocationList from './pages/LocationList';
// import Map from './pages/Map';
import FavouriteList from './pages/FavouriteList';
import SignUpPage from './pages/SignUpPage';

import EventList from './pages/EventList';
// import NoMatch from './pages/NoMatch';
import LoginPage from './pages/LoginPage';
// import SingleLocation from './pages/SingleLocation';

import Navbar from './pages/Navbar';

class App extends React.Component {
  render() {
    // return(<Navbar />);
    return (
      <BrowserRouter>
        
        <Navbar />

        <hr />

        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            {/* <Route path="/LocationList" element={<LocationList />} /> */}
            {/* <Route path="/SingleLocation" element={<SingleLocation />} /> */}
            <Route path="/EventList" element={<EventList />} />
            {/* <Route path="/Map" element={<Map />} /> */}
            <Route path="/FavouriteList" element={<FavouriteList />} />
            {/* <Route path="*" element={<NoMatch />} /> */}

        </Routes>
      </BrowserRouter>
    );
  }
}

export default App;