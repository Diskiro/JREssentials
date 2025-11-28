import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Badge,
    Menu,
    MenuItem,
    Box,
    useMediaQuery,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import '../../styles/Header.css';
import InactivityHandler from '../InactivityHandler/InactivityHandler';
import OptimizedImage from '../OptimizedImage/OptimizedImage';

const Header = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [categories, setCategories] = useState([]);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { cart } = useCart();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const isMobile = useMediaQuery('(max-width:1023px)');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
                const querySnapshot = await getDocs(q);
                const categoriesList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setCategories(categoriesList);
            } catch (error) {
                console.error('Error al obtener categorías:', error);
            }
        };

        fetchCategories();
    }, []);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        handleClose();
        navigate('/');
    };

    const handleLogin = () => {
        navigate('/login');
    };

    const handleRegister = () => {
        navigate('/register');
    };

    const handleProfile = () => {
        navigate('/user');
        handleClose();
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    return (
        <>
            <InactivityHandler />
            <AppBar className='header' position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #e0e0e0', backgroundColor: '#fff' }}>
                <Toolbar className="header-container" sx={{ justifyContent: 'space-between',  minHeight: '65px' }}>
                    {isMobile ? (
                        <>
                            <Box sx={{ flex: '0 0 auto', display: 'flex', alignItems: 'center' }}>
                                <IconButton
                                    color="inherit"
                                    onClick={toggleMobileMenu}
                                    sx={{ mr: 1 }}
                                >
                                    <MenuIcon />
                                </IconButton>
                            </Box>
                            {/* Logo centrado */}
                            <Box sx={{ flex: '1 1 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                                <Link to="/" className="logo-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <OptimizedImage
                                        className="logo-mobile"
                                        src="/JR_Essentials.jpg"
                                        alt="J&R Essentials"
                                        width={65}
                                        height={65}
                                    />
                                </Link>
                            </Box>
                            {/* Carrito y usuario a la derecha */}
                            <Box sx={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <IconButton
                                    color="inherit"
                                    component={Link}
                                    to="/cart"
                                >
                                    <Badge badgeContent={cart.length} className="cart-badge">
                                        <ShoppingCartIcon />
                                    </Badge>
                                </IconButton>
                                <IconButton
                                    size="large"
                                    aria-label="account of current user"
                                    aria-controls="menu-appbar"
                                    aria-haspopup="true"
                                    onClick={user ? handleMenu : (e => setAnchorEl(e.currentTarget))}
                                    color="inherit"
                                >
                                    <AccountCircle />
                                </IconButton>
                            </Box>
                        </>
                    ) : (
                        <>
                            <Link to="/" className="logo-link" style={{ display: 'flex', alignItems: 'center' }}>
                                <img className="logo-desktop"
                                    src="/JR_Essentials.jpg"
                                    alt="J&R Essentials"
                                    style={{ width: '100px', height: '100px', objectFit: 'contain', marginRight: 8 }}
                                />
                            </Link>
                            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', gap: 2 }}>
                                {categories.slice(0, 4).map((category) => (
                                    <Button
                                        className='category-button'
                                        key={category.id}
                                        color="inherit"
                                        component={Link}
                                        to={`/catalogo?category=${category.name}`}
                                    >
                                        {category.name}
                                    </Button>
                                ))}
                                {categories.length > 4 && (
                                    <Button
                                        color="inherit"
                                        component={Link}
                                        to="/categorias"
                                    >
                                        Ver todas
                                    </Button>
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <IconButton
                                    color="inherit"
                                    component={Link}
                                    to="/cart"
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            transform: 'scale(1.1)',
                                            transition: 'all 0.3s ease'
                                        }
                                    }}
                                >
                                    <Badge badgeContent={cart.length} color="error">
                                        <ShoppingCartIcon />
                                    </Badge>
                                </IconButton>
                                {user ? (
                                    <>
                                        <Typography variant="body1" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
                                            Bienvenido {user.firstName || user.email}
                                        </Typography>
                                        <IconButton
                                            size="large"
                                            aria-label="account of current user"
                                            aria-controls="menu-appbar"
                                            aria-haspopup="true"
                                            onClick={handleMenu}
                                            color="inherit"
                                        >
                                            <AccountCircle />
                                        </IconButton>
                                    </>
                                ) : (
                                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
                                        <Button color="inherit" onClick={handleLogin}>
                                            Iniciar Sesión
                                        </Button>
                                        <Button color="inherit" onClick={handleRegister}>
                                            Registrarse
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        </>
                    )}
                    {/* Menú de usuario, visible en cualquier tamaño si hay usuario o no */}
                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorEl}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                    >
                        {user ? (
                            [
                                <MenuItem onClick={handleProfile} key="profile">Mi Perfil</MenuItem>,
                                <MenuItem onClick={handleLogout} key="logout">Cerrar Sesión</MenuItem>
                            ]
                        ) : (
                            [
                                <MenuItem onClick={() => { handleClose(); handleLogin(); }} key="login">Iniciar Sesión</MenuItem>,
                                <MenuItem onClick={() => { handleClose(); handleRegister(); }} key="register">Registrarse</MenuItem>
                            ]
                        )}
                    </Menu>
                </Toolbar>

                {/* Menú móvil */}
                {
                    isMobile && mobileMenuOpen && (
                        <Box
                            sx={{
                                position: 'fixed',
                                top: 65,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'white',
                                zIndex: 1100,
                                overflowY: 'auto',
                                padding: 2,
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        >
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {categories.slice(0, 4).map((category) => (
                                    <Button
                                        key={category.id}
                                        component={Link}
                                        to={`/catalogo?category=${category.name}`}
                                        onClick={toggleMobileMenu}
                                        sx={{
                                            color: 'text.primary',
                                            justifyContent: 'flex-start',
                                            padding: '12px 16px',
                                            '&:hover': {
                                                backgroundColor: 'rgba(0,0,0,0.04)'
                                            }
                                        }}
                                    >
                                        {category.name}
                                    </Button>
                                ))}
                                {categories.length > 4 && (
                                    <Button
                                        component={Link}
                                        to="/categorias"
                                        onClick={toggleMobileMenu}
                                        sx={{
                                            color: 'text.primary',
                                            justifyContent: 'flex-start',
                                            padding: '12px 16px',
                                            '&:hover': {
                                                backgroundColor: 'rgba(0,0,0,0.04)'
                                            }
                                        }}
                                    >
                                        Ver todas
                                    </Button>
                                )}
                                {!user && (
                                    <>
                                        <Button
                                            color="primary"
                                            variant="contained"
                                            onClick={() => {
                                                toggleMobileMenu();
                                                handleLogin();
                                            }}
                                            sx={{ mt: 2 }}
                                        >
                                            Iniciar Sesión
                                        </Button>
                                        <Button
                                            color="primary"
                                            variant="outlined"
                                            onClick={() => {
                                                toggleMobileMenu();
                                                handleRegister();
                                            }}
                                        >
                                            Registrarse
                                        </Button>
                                    </>
                                )}
                            </Box>
                        </Box>
                    )
                }
            </AppBar>
        </>
    );
};

export default Header;