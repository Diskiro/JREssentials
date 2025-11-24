import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import theme from './theme';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import HomePage from './pages/Home/HomePage';
import Catalog from './pages/Catalog/Catalog';
import Product from './pages/Product/Product';
import Cart from './pages/Cart/Cart';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import User from './pages/User/User';
import Checkout from './pages/Checkout/Checkout';
import OrderSuccess from './pages/Checkout/OrderSuccess';
import OrderDetails from './pages/Orders/OrderDetails';
import Categories from './pages/Categories/Categories';
import About from './pages/About/About';
import Contact from './pages/Contact/Contact';
import Terms from './pages/Terms/Terms';
import Privacy from './pages/Privacy/Privacy';
import NotFound from './pages/NotFound/NotFound';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import './styles/App.css';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <CartProvider>
                    <FavoritesProvider>
                        <Router>
                            <div className="app">
                                <Navbar />
                                <main className="main-content">
                                    <Routes>
                                        <Route path="/" element={<HomePage />} />
                                        <Route path="/catalogo" element={<Catalog />} />
                                        <Route path="/product/:id" element={<Product />} />
                                        <Route path="/cart" element={<Cart />} />
                                        <Route path="/login" element={<Login />} />
                                        <Route path="/register" element={<Register />} />
                                        <Route path="/user" element={
                                            <ProtectedRoute>
                                                <User />
                                            </ProtectedRoute>
                                        } />
                                        <Route path="/checkout" element={
                                            <ProtectedRoute>
                                                <Checkout />
                                            </ProtectedRoute>
                                        } />
                                        <Route path="/order-success" element={
                                            <ProtectedRoute>
                                                <OrderSuccess />
                                            </ProtectedRoute>
                                        } />
                                        <Route path="/orders/:orderId" element={
                                            <ProtectedRoute>
                                                <OrderDetails />
                                            </ProtectedRoute>
                                        } />
                                        <Route path="/categories" element={<Categories />} />
                                        <Route path="/about" element={<About />} />
                                        <Route path="/contact" element={<Contact />} />
                                        <Route path="/terms" element={<Terms />} />
                                        <Route path="/privacy" element={<Privacy />} />
                                        <Route path="*" element={<NotFound />} />
                                    </Routes>
                                </main>
                                <Footer />
                            </div>
                        </Router>
                    </FavoritesProvider>
                </CartProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App; 