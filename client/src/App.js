import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import './styles/App.css';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import HomePage from './pages/Home/HomePage';
import CatalogPage from './pages/Catalog/Catalog';
import ProductPage from './pages/Product/Product';
import CartPage from './pages/Cart/Cart';
import CheckoutPage from './pages/Checkout/Checkout';
import { LoginPage } from './pages/Login/Login';
import { RegisterPage } from './pages/Register/Register';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Toaster } from 'react-hot-toast';
import ConfirmationPage from './pages/Confirmation/Confirmation';
import User from './pages/User/User';
import OrderDetail from './pages/OrderDetail/OrderDetail';
import NotFound from './pages/NotFound/NotFound';
import EditProfile from './pages/Profile/EditProfile';
import CategoriesPage from './pages/Categories/CategoriesPage';
import About from './pages/About/About';
import Accessories from './pages/Accessories/Accessories';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <CartProvider>
                    <Router>
                        <ScrollToTop />
                        <Header />
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/catalogo" element={<CatalogPage />} />
                            <Route path="/categorias" element={<CategoriesPage />} />
                            <Route path="/producto/:id" element={<ProductPage />} />
                            <Route path="/cart" element={<CartPage />} />
                            <Route path="/checkout" element={<CheckoutPage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/confirmation" element={<ConfirmationPage />} />
                            <Route path="/user" element={<User />} />
                            <Route path="/orders/:orderId" element={<OrderDetail />} />
                            <Route path="/profile/edit" element={<EditProfile />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/accessories" element={<Accessories />} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                        <Footer />
                        <Toaster position="bottom-center" />
                    </Router>
                </CartProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;