import React from 'react';

// Importing web pages from /pages directory 
import Home from './components/Home';
import LocationList from './components/LocationList';
import EventList from './components/EventList';
import Map from './components/Map';
import FavouriteList from './components/FavouriteList';
import NoMatch from './components/NoMatch';
import LoginPage from './components/LoginPage';
import SingleLocation from './components/SingleLocation';

class App extends React.Component {
  render() {
    return (
      <BrowserRouter>
        <div>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/LocationList">Images</Link></li>
            <li><Link to="/SingleLocation">Images</Link></li>
            <li><Link to="/EventList">Slideshow</Link></li>
            <li><Link to="/Map">Slideshow</Link></li>
            <li><Link to="/FavouriteList">Slideshow</Link></li>
            
          </ul>
        </div>

        <hr />

        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/LocationList" element={<LocationList />} />
            <Route path="/SingleLocation" element={<SingleLocation />} />
            <Route path="/EventList" element={<EventList />} />
            <Route path="/Mao" element={<Map />} />
            <Route path="/FavouriteList" element={<FavouriteList />} />
            <Route path="*" element={<NoMatch />} />
        </Routes>
      </BrowserRouter>
    );
  }
}

export default App;