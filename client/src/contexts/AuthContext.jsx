import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Add required scopes for Google services
    provider.addScope('email');
    provider.addScope('profile');
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Store user info in localStorage for persistence
      const userInfo = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        accessToken: result._tokenResponse?.oauthAccessToken
      };
      
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      return result;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      // Handle specific error codes
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup blocked. Please allow popups and try again.');
      }
      throw new Error('Failed to sign in. Please try again.');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userInfo');
      setCurrentUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      
      // Update localStorage when user state changes
      if (user) {
        const userInfo = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        };
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
      } else {
        localStorage.removeItem('userInfo');
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signInWithGoogle,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
