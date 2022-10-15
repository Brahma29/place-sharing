import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NewPlace from './places/pages/NewPlace';
import UpdatePlace from './places/pages/UpdatePlace';
import UserPlaces from './places/pages/UserPlaces';
import MainNavigation from './shared/components/Navigation/MainNavigation';
import Auth from './users/pages/Auth';
import Users from './users/pages/Users';
import { AuthContext } from './shared/context/auth-context';

let logOutTimer;

function App() {
  const [token, setToken] = useState();
  const [tokenExpirationDate, setTokenExpirationDate] = useState();
  const [userId, setUserId] = useState(false);

  const login = useCallback((navigate, uid, token, expirationDate) => {
    setToken(token);
    setUserId(uid);
    const tokenExpiration =
      expirationDate || new Date(new Date().getTime() + 1000 * 60 * 60 * 60);
    setTokenExpirationDate(tokenExpiration);
    localStorage.setItem(
      'userData',
      JSON.stringify({
        userId: uid,
        token: token,
        expiration: tokenExpiration.toISOString(),
      })
    );
    navigate('/');
  }, []);

  const logOut = useCallback(() => {
    setToken(null);
    setTokenExpirationDate(null);
    setUserId(null);
    localStorage.removeItem('userData');
  }, []);

  // useEffect(() => {
  //   const storedData = JSON.parse(localStorage.getItem('userData'));
  //   if (storedData && storedData.token && new Date(storedData.expiration) > new Date()) {
  //     login(storedData.userId, storedData.token, new Date(storedData.expiration));
  //   }
  // }, []);

  useEffect(() => {
    if (token) {
      const remainingTime =
        tokenExpirationDate.getTime() - new Date().getTime();
      logOutTimer = setTimeout(logOut, tokenExpirationDate);
    } else {
      clearTimeout(logOutTimer);
    }
  }, [token, logOut, tokenExpirationDate]);

  let routes;

  if (token) {
    routes = (
      <React.Fragment>
        <Route path="/" exact element={<Users />} />
        <Route path="/:userId/places" exact element={<UserPlaces />} />
        <Route path="/places/new" exact element={<NewPlace />} />
        <Route path="/places/:placeId" exact element={<UpdatePlace />} />
      </React.Fragment>
    );
  } else {
    routes = (
      <React.Fragment>
        <Route path="/" exact element={<Users />} />
        <Route path="/:userId/places" exact element={<UserPlaces />} />
        <Route path="/auth" exact element={<Auth />} />
      </React.Fragment>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!token,
        token: token,
        login: login,
        logOut: logOut,
        userId,
      }}
    >
      <Router>
        <MainNavigation />
        <main>
          <Routes>{routes}</Routes>
        </main>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
