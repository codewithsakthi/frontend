import React, { useState, useEffect, useMemo } from 'react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    setDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    onSnapshot
} from 'firebase/firestore';


// --- Firebase Configuration ---
// IMPORTANT: Replace this with your own Firebase project configuration.
const firebaseConfig = {
  apiKey: "AIzaSyA5Ap7DWw6eVVvMVCFU8J8Mb7XyN80IF70",
  authDomain: "ecommerce-cb55d.firebaseapp.com",
  projectId: "ecommerce-cb55d",
  storageBucket: "ecommerce-cb55d.firebasestorage.app",
  messagingSenderId: "65795253567",
  appId: "1:65795253567:web:a397ac4b9753eff74c9f8a",
  measurementId: "G-LSX5BKFP9C"
};

// --- SVG Icon Components ---
const SearchIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);
const ShoppingBagIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>);
const MenuIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>);
const XIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const StarIcon = ({ filled, color = "#FBBF24" }) => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={filled ? color : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>);
const CheckCircleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>);
const HeartIcon = ({ filled }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={filled ? 'text-pink-500' : ''}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>);


// --- Page Components ---
const HomePage = ({ products, onAddToCart, onProductSelect, onToggleWishlist, wishlist, onQuickView }) => (
    <>
        <section className="glass-card rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 mb-16">
            <div className="md:w-1/2 text-center md:text-left">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">Discover Your Style</h1>
                <p className="text-lg text-gray-200 mb-8">Browse our curated collection of fashion, electronics, and more. Quality products for your modern life.</p>
                <button onClick={() => document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' })} className="bg-white/90 text-black font-bold py-3 px-8 rounded-full hover:bg-white transition-transform duration-300 inline-block transform hover:scale-105">Shop Collection</button>
            </div>
            <div className="md:w-1/2 p-4 bg-white/10 rounded-2xl">
                 {products.length > 0 && (
                    <div className="relative group cursor-pointer" onClick={() => onProductSelect(products[4])}>
                        <img src={products[4]?.image} alt={products[4]?.title} className="rounded-2xl w-full h-auto shadow-2xl object-contain max-h-96 transform group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                           <div className="text-center text-white p-4">
                                <h3 className="text-2xl font-bold">{products[4]?.title}</h3>
                                <p className="text-lg mt-2">View Details</p>
                           </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
        <section id="featured-products">
            <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {products.slice(0, 8).map(product => (
                    <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onProductSelect={onProductSelect} onToggleWishlist={onToggleWishlist} isWishlisted={wishlist.some(item => item.id === product.id)} onQuickView={onQuickView} />
                ))}
            </div>
        </section>
    </>
);

const ShopPage = ({ products, onAddToCart, onProductSelect, onToggleWishlist, wishlist, onQuickView }) => {
    const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
    const [sortBy, setSortBy] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 8;

    const categories = useMemo(() => ['all', ...new Set(products.map(p => p.category))], [products]);

    const handlePriceChange = (e) => {
        const { name, value } = e.target;
        setPriceRange(prev => ({ ...prev, [name]: value ? parseInt(value, 10) : 0 }));
    };

    const filteredProducts = useMemo(() => {
        return products
            .filter(p => selectedCategory === 'all' || p.category === selectedCategory)
            .filter(p => (p.price * 80) >= priceRange.min && (p.price * 80) <= priceRange.max);
    }, [products, selectedCategory, priceRange]);

    const sortedProducts = useMemo(() => {
        let prods = [...filteredProducts];
        if (sortBy === 'price-asc') {
            prods.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-desc') {
            prods.sort((a, b) => b.price - a.price);
        }
        return prods;
    }, [filteredProducts, sortBy]);

    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * productsPerPage;
        return sortedProducts.slice(startIndex, startIndex + productsPerPage);
    }, [sortedProducts, currentPage]);

    const totalPages = Math.ceil(sortedProducts.length / productsPerPage);

    const handleReset = () => {
        setPriceRange({ min: 0, max: 100000 });
        setSortBy(null);
        setSelectedCategory('all');
        setCurrentPage(1);
    };

    return (
        <div>
            <div className="glass-card rounded-3xl p-6 mb-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4">
                 <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }} className="bg-white/10 text-white font-semibold py-2 px-4 rounded-full transition-colors capitalize">
                    {categories.map(cat => <option key={cat} value={cat} className="bg-gray-800">{cat}</option>)}
                </select>
                <button onClick={() => setSortBy('price-asc')} className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-6 rounded-full transition-colors">Price: Low-High</button>
                <button onClick={() => setSortBy('price-desc')} className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-6 rounded-full transition-colors">Price: High-Low</button>
                <div className="flex items-center gap-2">
                    <input type="number" name="min" placeholder="Min Price" value={priceRange.min} onChange={handlePriceChange} className="w-24 rounded-full p-2 bg-white/20 border-none focus:ring-0 text-white placeholder-gray-300"/>
                    <span>-</span>
                    <input type="number" name="max" placeholder="Max Price" value={priceRange.max} onChange={handlePriceChange} className="w-24 rounded-full p-2 bg-white/20 border-none focus:ring-0 text-white placeholder-gray-300"/>
                </div>
                <button onClick={handleReset} className="text-sm hover:text-gray-300">Reset</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {paginatedProducts.map(product => (
                    <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onProductSelect={onProductSelect} onToggleWishlist={onToggleWishlist} isWishlisted={wishlist.some(item => item.id === product.id)} onQuickView={onQuickView} />
                ))}
            </div>
            {totalPages > 1 && (
                <div className="flex justify-center items-center mt-12 gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button key={page} onClick={() => setCurrentPage(page)} className={`w-10 h-10 rounded-full transition-colors ${currentPage === page ? 'bg-pink-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}>{page}</button>
                    ))}
                </div>
            )}
        </div>
    );
};

const ProductDetailPage = ({ product, onAddToCart, onNavigate, onToggleWishlist, isWishlisted }) => {
    return (
        <div className="glass-card rounded-3xl p-8 md:p-12">
            <button onClick={() => onNavigate('shop')} className="mb-8 text-sm hover:text-gray-300">← Back to Shop</button>
            <div className="flex flex-col md:flex-row gap-12">
                <div className="md:w-1/2 flex justify-center items-center p-4 bg-white rounded-2xl">
                    <img src={product.image} alt={product.title} className="max-h-96 object-contain" />
                </div>
                <div className="md:w-1/2">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-pink-400 text-sm capitalize mb-2">{product.category}</p>
                            <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
                        </div>
                        <button onClick={() => onToggleWishlist(product)} className="p-2 -mr-2 -mt-2 flex-shrink-0"><HeartIcon filled={isWishlisted} /></button>
                    </div>
                    <p className="text-gray-300 text-base mb-6">{product.description}</p>
                    <div className="flex items-center gap-4 mb-6">
                        <StarRating rating={product.rating.rate} />
                        <span className="text-gray-400">({product.rating.count} reviews)</span>
                    </div>
                    <p className="font-bold text-4xl mb-8">₹{(product.price * 80).toFixed(2)}</p>
                     <div className="flex flex-col gap-4">
                        <button onClick={() => onAddToCart(product)} className="w-full bg-pink-500 text-white font-bold py-3 rounded-full hover:bg-pink-600 transition-colors">Add to Cart</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const WishlistPage = ({ wishlist, onToggleWishlist, onAddToCart, onProductSelect, onQuickView, onNavigate }) => (
    <div className="glass-card rounded-3xl p-8 md:p-12">
        <h1 className="text-3xl font-bold text-center mb-8">Your Wishlist</h1>
        {wishlist.length === 0 ? (
            <div className="text-center text-gray-300">
                <p>Your wishlist is empty. Add items by clicking the heart icon!</p>
                <button onClick={() => onNavigate('shop')} className="mt-4 bg-pink-500 text-white font-bold py-2 px-6 rounded-full hover:bg-pink-600">Browse Products</button>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {wishlist.map(product => (
                    <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onProductSelect={onProductSelect} onToggleWishlist={onToggleWishlist} isWishlisted={true} onQuickView={onQuickView} />
                ))}
            </div>
        )}
    </div>
);

const CheckoutPage = ({ cartItems, onPlaceOrder }) => {
    const [step, setStep] = useState(1);
    const totalPrice = cartItems.reduce((total, item) => total + ((item.price * 80) * item.quantity), 0);
    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    return (
        <div className="glass-card rounded-3xl p-8 md:p-12 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8">Checkout</h1>
            <div className="flex justify-between items-center mb-12 max-w-md mx-auto">
                <div className="flex flex-col items-center"><div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-pink-500' : 'bg-white/10'}`}>1</div><p className="mt-2 text-sm">Shipping</p></div>
                <div className={`flex-grow h-1 mx-4 ${step >= 2 ? 'bg-pink-500' : 'bg-white/10'}`}></div>
                <div className="flex flex-col items-center"><div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-pink-500' : 'bg-white/10'}`}>2</div><p className="mt-2 text-sm">Payment</p></div>
                <div className={`flex-grow h-1 mx-4 ${step >= 3 ? 'bg-pink-500' : 'bg-white/10'}`}></div>
                <div className="flex flex-col items-center"><div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-pink-500' : 'bg-white/10'}`}>3</div><p className="mt-2 text-sm">Review</p></div>
            </div>

            {step === 1 && (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Shipping Address</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Full Name" className="p-3 bg-white/10 rounded-lg border-none focus:ring-2 focus:ring-pink-500" />
                        <input type="email" placeholder="Email Address" className="p-3 bg-white/10 rounded-lg border-none focus:ring-2 focus:ring-pink-500" />
                        <input type="text" placeholder="Address Line 1" className="p-3 bg-white/10 rounded-lg border-none focus:ring-2 focus:ring-pink-500 md:col-span-2" />
                        <input type="text" placeholder="City" className="p-3 bg-white/10 rounded-lg border-none focus:ring-2 focus:ring-pink-500" />
                        <input type="text" placeholder="Pincode" className="p-3 bg-white/10 rounded-lg border-none focus:ring-2 focus:ring-pink-500" />
                    </div>
                    <div className="mt-8 flex justify-end"><button onClick={handleNext} className="bg-pink-500 text-white font-bold py-3 px-8 rounded-full hover:bg-pink-600">Next: Payment</button></div>
                </div>
            )}
            {step === 2 && (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Payment Details</h2>
                    <div className="space-y-4">
                        <input type="text" placeholder="Card Number" className="w-full p-3 bg-white/10 rounded-lg border-none focus:ring-2 focus:ring-pink-500" />
                        <div className="grid grid-cols-2 gap-4"><input type="text" placeholder="MM / YY" className="p-3 bg-white/10 rounded-lg border-none focus:ring-2 focus:ring-pink-500" /><input type="text" placeholder="CVC" className="p-3 bg-white/10 rounded-lg border-none focus:ring-2 focus:ring-pink-500" /></div>
                    </div>
                    <div className="mt-8 flex justify-between"><button onClick={handleBack} className="bg-white/20 text-white font-bold py-3 px-8 rounded-full hover:bg-white/30">Back</button><button onClick={handleNext} className="bg-pink-500 text-white font-bold py-3 px-8 rounded-full hover:bg-pink-600">Next: Review</button></div>
                </div>
            )}
            {step === 3 && (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Review Your Order</h2>
                    <div className="space-y-2 bg-black/20 p-4 rounded-lg mb-6">
                        {cartItems.map(item => (<div key={item.id} className="flex justify-between"><span>{item.title} x {item.quantity}</span><span>₹{((item.price * 80) * item.quantity).toLocaleString('en-IN')}</span></div>))}
                        <div className="border-t border-white/10 my-2"></div>
                        <div className="flex justify-between font-bold text-lg"><span>Total</span><span>₹{totalPrice.toLocaleString('en-IN')}</span></div>
                    </div>
                    <div className="mt-8 flex justify-between"><button onClick={handleBack} className="bg-white/20 text-white font-bold py-3 px-8 rounded-full hover:bg-white/30">Back</button><button onClick={onPlaceOrder} className="bg-green-500 text-white font-bold py-3 px-8 rounded-full hover:bg-green-600">Place Order</button></div>
                </div>
            )}
        </div>
    );
};

const OrderConfirmationPage = ({ onNavigate }) => (
    <div className="glass-card rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto">
        <CheckCircleIcon />
        <h1 className="text-4xl font-bold mt-6 mb-4">Thank You!</h1>
        <p className="text-lg text-gray-300 mb-8">Your order has been placed successfully. We've sent a confirmation to your email.</p>
        <button onClick={() => onNavigate('home')} className="bg-pink-500 text-white font-bold py-3 px-8 rounded-full hover:bg-pink-600">Continue Shopping</button>
    </div>
);

const PlaceholderPage = ({ title, children }) => (
    <div className="glass-card rounded-3xl p-8 md:p-12 text-center">
        <h1 className="text-4xl font-bold">{title}</h1>
        <div className="mt-4 text-lg text-gray-300">{children}</div>
    </div>
);


// --- Reusable Components ---
const ProductCard = ({ product, onAddToCart, onProductSelect, onToggleWishlist, isWishlisted, onQuickView }) => {
    return (
        <div className="glass-card rounded-2xl overflow-hidden group flex flex-col transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl">
            <div className="relative p-4 bg-white">
                <img onClick={() => onProductSelect(product)} src={product.image} alt={product.title} className="w-full h-52 object-contain transform group-hover:scale-110 transition-transform duration-500 cursor-pointer" />
                <div className="absolute top-0 left-0 w-full h-full bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <button onClick={(e) => { e.stopPropagation(); onQuickView(product); }} className="bg-white/90 text-black font-semibold py-2 px-6 rounded-full hover:bg-white transition-colors">Quick View</button>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onToggleWishlist(product); }} className="absolute top-2 right-2 p-2 bg-black/30 rounded-full hover:bg-pink-500/50 transition-colors"><HeartIcon filled={isWishlisted} /></button>
            </div>
            <div className="p-5 flex flex-col flex-grow bg-gray-900/10">
                <h3 onClick={() => onProductSelect(product)} className="font-semibold text-lg cursor-pointer h-12 overflow-hidden">{product.title}</h3>
                <p className="font-bold text-xl mt-2">₹{(product.price * 80).toFixed(2)}</p>
                 <button onClick={(e) => { e.stopPropagation(); onAddToCart(product); }} className="w-full mt-auto bg-pink-500/50 text-white font-semibold py-2 px-4 rounded-lg hover:bg-pink-500/80 transition-colors">Add to Cart</button>
            </div>
        </div>
    );
};

const StarRating = ({ rating }) => {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    return (
        <div className="flex">
            {[...Array(fullStars)].map((_, i) => <StarIcon key={`full-${i}`} filled={true} />)}
            {[...Array(emptyStars)].map((_, i) => <StarIcon key={`empty-${i}`} filled={false} />)}
        </div>
    );
};

const Header = ({ onMenuToggle, onCartToggle, onSearchToggle, cartCount, onNavigate, currentUser, onLogout, onAuthModalOpen }) => (
    <header className="glass-card sticky top-4 mx-auto max-w-7xl rounded-2xl z-50 my-4">
        <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="text-2xl font-bold tracking-wider"><button onClick={() => onNavigate('home')}>Prismora</button></div>
                <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
                    <button onClick={() => onNavigate('home')} className="hover:text-gray-300">Home</button>
                    <button onClick={() => onNavigate('shop')} className="hover:text-gray-300">Shop</button>
                    <button onClick={() => onNavigate('wishlist')} className="hover:text-gray-300">Wishlist</button>
                    <button onClick={() => onNavigate('about')} className="hover:text-gray-300">About</button>
                    <button onClick={() => onNavigate('contact')} className="hover:text-gray-300">Contact</button>
                </nav>
                <div className="flex items-center space-x-6">
                    <button onClick={onSearchToggle} className="hover:text-gray-300"><SearchIcon /></button>
                    <button onClick={onCartToggle} className="hover:text-gray-300 relative">
                        <ShoppingBagIcon />
                        {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">{cartCount}</span>}
                    </button>
                     {currentUser ? (
                        <div className="hidden sm:flex items-center gap-4">
                            <span>Hi, {currentUser.displayName || currentUser.email.split('@')[0]}!</span>
                            <button onClick={onLogout} className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full">Logout</button>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center space-x-4">
                            <button onClick={() => onAuthModalOpen('login')} className="text-sm hover:text-gray-300">Login</button>
                            <button onClick={() => onAuthModalOpen('signup')} className="bg-pink-500 text-white font-bold text-sm py-2 px-4 rounded-full hover:bg-pink-600">Sign Up</button>
                        </div>
                    )}
                    <button className="md:hidden hover:text-gray-300" onClick={onMenuToggle}><MenuIcon /></button>
                </div>
            </div>
        </div>
    </header>
);

const MobileMenu = ({ onNavigate, currentUser, onLogout, onAuthModalOpen }) => (
    <div className="glass-card md:hidden mx-auto max-w-7xl rounded-2xl -mt-4 mb-4">
        <nav className="flex flex-col space-y-4 text-sm font-medium p-6">
            <button onClick={() => onNavigate('home')} className="text-left hover:text-gray-300">Home</button>
            <button onClick={() => onNavigate('shop')} className="text-left hover:text-gray-300">Shop</button>
            <button onClick={() => onNavigate('wishlist')} className="text-left hover:text-gray-300">Wishlist</button>
            <button onClick={() => onNavigate('about')} className="text-left hover:text-gray-300">About</button>
            <button onClick={() => onNavigate('contact')} className="text-left hover:text-gray-300">Contact</button>
            <div className="border-t border-white/10 my-2"></div>
            {currentUser ? (
                <>
                    <p className="text-left">Welcome, {currentUser.displayName || currentUser.email}!</p>
                    <button onClick={onLogout} className="text-left text-red-400 hover:text-red-300">Logout</button>
                </>
            ) : (
                <>
                    <button onClick={() => onAuthModalOpen('login')} className="text-left hover:text-gray-300">Login</button>
                    <button onClick={() => onAuthModalOpen('signup')} className="text-left hover:text-gray-300">Sign Up</button>
                </>
            )}
        </nav>
    </div>
);

const CartModal = ({ isOpen, onToggle, cartItems, onUpdateQuantity, onNavigate }) => {
    if (!isOpen) return null;
    const totalPrice = cartItems.reduce((total, item) => total + ((item.price * 80) * item.quantity), 0);
    const handleCheckout = () => { onToggle(); onNavigate('checkout'); };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="glass-card rounded-2xl w-full max-w-lg mx-4">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">Your Cart</h2><button onClick={onToggle} className="text-white hover:text-gray-300"><XIcon /></button></div>
                    {cartItems.length === 0 ? <p className="text-center text-gray-300">Your cart is empty.</p> : (
                        <div>
                            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <img src={item.image} alt={item.title} className="w-16 h-16 rounded-lg object-contain bg-white p-1" />
                                            <div><h3 className="font-semibold text-sm">{item.title}</h3><p className="text-gray-300 text-sm">₹{(item.price * 80).toFixed(2)}</p></div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 bg-white/10 rounded-full">-</button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 bg-white/10 rounded-full">+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-white/10 mt-6 pt-6">
                                <div className="flex justify-between items-center font-bold text-lg"><span>Total</span><span>₹{totalPrice.toLocaleString('en-IN')}</span></div>
                                <button onClick={handleCheckout} className="w-full bg-pink-500 text-white font-bold py-3 mt-6 rounded-full hover:bg-pink-600">Proceed to Checkout</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SearchModal = ({ isOpen, onToggle, onProductSelect, products }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const searchResults = searchTerm ? products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())) : [];
    const handleSelect = (product) => { onProductSelect(product); onToggle(); };
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onToggle}>
            <div className="glass-card rounded-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">Search Products</h2><button onClick={onToggle} className="text-white hover:text-gray-300"><XIcon /></button></div>
                    <div className="relative">
                        <input type="search" placeholder="Type to search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus className="w-full rounded-lg p-3 bg-white/20 border-none focus:ring-0 text-white placeholder-gray-300" />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2"><SearchIcon /></div>
                    </div>
                    <div className="mt-4 max-h-60 overflow-y-auto">
                        {searchResults.map(product => (
                            <div key={product.id} onClick={() => handleSelect(product)} className="p-2 hover:bg-white/10 rounded-lg cursor-pointer flex items-center gap-3">
                                <img src={product.image} alt={product.title} className="w-10 h-10 rounded object-contain bg-white p-1" />{product.title}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AuthModal = ({ mode, onToggle, onLogin, onSignUp, onSwitchMode }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            if (mode === 'login') {
                await onLogin({ email, password });
            } else {
                await onSignUp({ name, email, password });
            }
            onToggle();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!mode) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onToggle}>
            <div className="glass-card rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-8">
                    <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">{mode === 'login' ? 'Login' : 'Sign Up'}</h2><button type="button" onClick={onToggle} className="text-white hover:text-gray-300"><XIcon /></button></div>
                    <div className="space-y-4">
                        {mode === 'signup' && <input type="text" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} required className="w-full p-3 bg-white/10 rounded-lg border-none focus:ring-2 focus:ring-pink-500" />}
                        <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-3 bg-white/10 rounded-lg border-none focus:ring-2 focus:ring-pink-500" />
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-3 bg-white/10 rounded-lg border-none focus:ring-2 focus:ring-pink-500" />
                    </div>
                    {error && <p className="text-red-400 text-xs mt-4 text-center">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full mt-6 bg-pink-500 text-white font-bold py-3 rounded-full hover:bg-pink-600 disabled:opacity-50">{isLoading ? 'Processing...' : (mode === 'login' ? 'Login' : 'Create Account')}</button>
                    <p className="text-center text-sm mt-4">{mode === 'login' ? "Don't have an account? " : "Already have an account? "}<button type="button" onClick={onSwitchMode} className="text-pink-400 hover:underline">{mode === 'login' ? 'Sign Up' : 'Login'}</button></p>
                </form>
            </div>
        </div>
    );
};

const QuickViewModal = ({ product, onToggle, onAddToCart, onProductSelect }) => {
    if (!product) return null;
    const handleViewDetails = () => { onToggle(); onProductSelect(product); };
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onToggle}>
            <div className="glass-card rounded-2xl w-full max-w-4xl mx-4" onClick={e => e.stopPropagation()}>
                <div className="p-8 relative">
                    <button onClick={onToggle} className="absolute top-4 right-4 text-white hover:text-gray-300"><XIcon /></button>
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="md:w-1/2 flex justify-center items-center p-4 bg-white rounded-lg"><img src={product.image} alt={product.title} className="max-h-80 object-contain" /></div>
                        <div className="md:w-1/2">
                            <h2 className="text-3xl font-bold mb-2">{product.title}</h2>
                            <p className="text-gray-300 mb-4 text-sm h-24 overflow-y-auto">{product.description}</p>
                            <p className="font-bold text-2xl mb-6">₹{(product.price * 80).toFixed(2)}</p>
                            <div className="flex flex-col gap-4">
                                <button onClick={() => onAddToCart(product)} className="w-full bg-pink-500 text-white font-bold py-3 rounded-full hover:bg-pink-600">Add to Cart</button>
                                <button onClick={handleViewDetails} className="w-full bg-white/10 text-white font-semibold py-3 rounded-full hover:bg-white/20">View Full Details</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Footer = ({ onNavigate }) => (
     <footer className="mt-20">
        <div className="glass-card rounded-t-3xl max-w-7xl mx-auto">
            <div className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
                    <div><h3 className="font-bold text-lg mb-4">Prismora</h3><p className="text-gray-300 text-sm">Your one-stop shop for everything.</p></div>
                    <div>
                        <h3 className="font-bold text-lg mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li><button onClick={() => onNavigate('about')} className="hover:text-white">About Us</button></li>
                            <li><button onClick={() => onNavigate('contact')} className="hover:text-white">Contact</button></li>
                        </ul>
                    </div>
                    <div><h3 className="font-bold text-lg mb-4">Follow Us</h3><ul className="space-y-2 text-sm text-gray-300"><li><a href="#" className="hover:text-white">Instagram</a></li><li><a href="#" className="hover:text-white">Twitter</a></li></ul></div>
                    <div>
                        <h3 className="font-bold text-lg mb-4">Newsletter</h3>
                        <p className="text-gray-300 text-sm mb-4">Get updates on new arrivals.</p>
                        <form className="flex" onSubmit={e => e.preventDefault()}><input type="email" placeholder="Your Email" className="w-full rounded-l-lg p-2 bg-black/20 border-none focus:ring-0" /><button type="submit" className="bg-white/90 text-black font-bold px-4 rounded-r-lg">Go</button></form>
                    </div>
                </div>
                <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm text-gray-400"><p>&copy; 2025 Prismora. All Rights Reserved.</p></div>
            </div>
        </div>
    </footer>
);


// --- Main App Component ---
export default function App() {
    // Firebase state
    const [auth, setAuth] = useState(null);
    const [db, setDb] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // App state
    const [products, setProducts] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [currentPage, setCurrentPage] = useState('home');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isCartOpen, setCartOpen] = useState(false);
    const [isSearchOpen, setSearchOpen] = useState(false);
    const [cartItems, setCartItems] = useState([]);
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [authModalState, setAuthModalState] = useState(null); // FIX: Added missing state

    // --- Firebase Initialization and Auth Subscription ---
    useEffect(() => {
        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);
        setAuth(authInstance);
        setDb(dbInstance);

        const unsubscribe = onAuthStateChanged(authInstance, (user) => {
            setCurrentUser(user);
            setIsAuthReady(true);
        });

        return () => unsubscribe();
    }, []);

    // --- Fetch product data ---
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('https://fakestoreapi.com/products');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                setProducts(data);
            } catch (e) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, []);
    
    // --- Sync Wishlist and Cart with Firestore (if user is logged in) ---
    useEffect(() => {
        if (!db || !currentUser) {
            // If logged out, load from localStorage
            try {
                const savedCart = localStorage.getItem('shoppia_cart_guest');
                if (savedCart) setCartItems(JSON.parse(savedCart));
                const savedWishlist = localStorage.getItem('shoppia_wishlist_guest');
                if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
            } catch (e) { console.error("Failed to load guest data", e); }
            return;
        };

        // If logged in, sync with Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setWishlist(data.wishlist || []);
                setCartItems(data.cart || []);
            }
        });

        // Clear guest cart on login
        localStorage.removeItem('shoppia_cart_guest');
        localStorage.removeItem('shoppia_wishlist_guest');

        return () => unsubscribe();
    }, [db, currentUser]);

    // --- Save cart/wishlist to localStorage for guests ---
     useEffect(() => {
        if (!currentUser) {
            localStorage.setItem('shoppia_cart_guest', JSON.stringify(cartItems));
        }
    }, [cartItems, currentUser]);

    useEffect(() => {
        if (!currentUser) {
            localStorage.setItem('shoppia_wishlist_guest', JSON.stringify(wishlist));
        }
    }, [wishlist, currentUser]);


    // --- Mouse move effect for glass card glow ---
    useEffect(() => {
        const handleMouseMove = (e) => {
            document.querySelectorAll('.glass-card').forEach(card => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
            });
        };
        document.addEventListener('mousemove', handleMouseMove);
        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // --- Navigation and Modal Handlers ---
    const handleNavigation = (page) => {
        setCurrentPage(page);
        setSelectedProduct(null);
        setMobileMenuOpen(false);
        window.scrollTo(0, 0);
    };

    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setCurrentPage('productDetail');
        window.scrollTo(0, 0);
    };

    const handlePlaceOrder = async () => { 
        if(currentUser) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, { cart: [] });
        }
        setCartItems([]); 
        handleNavigation('orderConfirmation'); 
    };
    const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);
    const toggleCart = () => setCartOpen(!isCartOpen);
    const toggleSearch = () => setSearchOpen(!isSearchOpen);
    const handleQuickView = (product) => setQuickViewProduct(product);
    const toggleAuthModal = (mode = null) => setAuthModalState(mode);

    // --- Firebase Auth Actions ---
    const handleSignUp = async ({ name, email, password }) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userDocRef, {
            displayName: name,
            email: email,
            wishlist: [],
            cart: []
        });
    };

    const handleLogin = async ({ email, password }) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const handleLogout = async () => {
        await signOut(auth);
        setCartItems([]);
        setWishlist([]);
    };

    // --- Cart and Wishlist Actions ---
    const updateFirestore = async (data) => {
        if (currentUser) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, data);
        }
    };

    const addToCart = (productToAdd) => {
        const newCart = [...cartItems];
        const existingItemIndex = newCart.findIndex(item => item.id === productToAdd.id);
        if (existingItemIndex > -1) {
            newCart[existingItemIndex].quantity += 1;
        } else {
            newCart.push({ ...productToAdd, quantity: 1 });
        }
        setCartItems(newCart);
        if (currentUser) updateFirestore({ cart: newCart });
    };

    const updateQuantity = (productId, newQuantity) => {
        let newCart;
        if (newQuantity <= 0) {
            newCart = cartItems.filter(item => item.id !== productId);
        } else {
            newCart = cartItems.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item);
        }
        setCartItems(newCart);
        if (currentUser) updateFirestore({ cart: newCart });
    };

    const toggleWishlist = async (product) => {
        if (!currentUser) {
            toggleAuthModal('login');
            return;
        }
        const userDocRef = doc(db, 'users', currentUser.uid);
        const wishlistedProduct = wishlist.find(item => item.id === product.id);

        if (wishlistedProduct) {
            await updateDoc(userDocRef, {
                wishlist: arrayRemove(wishlistedProduct)
            });
        } else {
            await updateDoc(userDocRef, {
                wishlist: arrayUnion(product)
            });
        }
    };

    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    const renderPage = () => {
        if (!isAuthReady || isLoading) {
            return <div className="text-center p-20">Loading...</div>;
        }
        if (error) {
            return <div className="text-center p-20 text-red-400">Error: {error}</div>;
        }
        if (currentPage === 'productDetail' && selectedProduct) {
            return <ProductDetailPage product={selectedProduct} onAddToCart={addToCart} onNavigate={handleNavigation} onToggleWishlist={toggleWishlist} isWishlisted={wishlist.some(item => item.id === selectedProduct.id)} />;
        }
        switch (currentPage) {
            case 'home': return <HomePage products={products} onAddToCart={addToCart} onProductSelect={handleProductSelect} onToggleWishlist={toggleWishlist} wishlist={wishlist} onQuickView={handleQuickView} />;
            case 'shop': return <ShopPage products={products} onAddToCart={addToCart} onProductSelect={handleProductSelect} onToggleWishlist={toggleWishlist} wishlist={wishlist} onQuickView={handleQuickView} />;
            case 'wishlist': return <WishlistPage wishlist={wishlist} onToggleWishlist={toggleWishlist} onAddToCart={addToCart} onProductSelect={handleProductSelect} onQuickView={handleQuickView} onNavigate={handleNavigation} />;
            case 'checkout': return <CheckoutPage cartItems={cartItems} onPlaceOrder={handlePlaceOrder} />;
            case 'orderConfirmation': return <OrderConfirmationPage onNavigate={handleNavigation} />;
            case 'about': return <PlaceholderPage title="About Us"><p>Shoppia is a modern e-commerce platform built with React, demonstrating a seamless shopping experience.</p></PlaceholderPage>;
            case 'contact': return <PlaceholderPage title="Contact Us"><p>For any inquiries, please reach out to us. This is a demo project.</p></PlaceholderPage>;
            default: return <HomePage products={products} onAddToCart={addToCart} onProductSelect={handleProductSelect} onToggleWishlist={toggleWishlist} wishlist={wishlist} onQuickView={handleQuickView} />;
        }
    };

    return (
        <>
            <style>{`
                body { font-family: 'Inter', sans-serif; color: #e0e0e0; background: linear-gradient(45deg, #1a1a2e, #2a002a, #002a2a, #1a1a2e); background-size: 400% 400%; animation: gradientBG 15s ease infinite; }
                @keyframes gradientBG { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                .glass-card { position: relative; background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0)); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37); overflow: hidden; }
                .glass-card::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.06), transparent 40%); opacity: 0; transition: opacity 0.5s; pointer-events: none; }
                .glass-card:hover::before { opacity: 1; }
            `}</style>

            <div className="relative z-10 min-h-screen">
                <CartModal isOpen={isCartOpen} onToggle={toggleCart} cartItems={cartItems} onUpdateQuantity={updateQuantity} onNavigate={handleNavigation} />
                <SearchModal isOpen={isSearchOpen} onToggle={toggleSearch} onProductSelect={handleProductSelect} products={products} />
                <AuthModal mode={authModalState} onToggle={() => toggleAuthModal()} onLogin={handleLogin} onSignUp={handleSignUp} onSwitchMode={() => setAuthModalState(authModalState === 'login' ? 'signup' : 'login')} />
                <QuickViewModal product={quickViewProduct} onToggle={() => setQuickViewProduct(null)} onAddToCart={addToCart} onProductSelect={handleProductSelect} />

                <Header onMenuToggle={toggleMobileMenu} onCartToggle={toggleCart} onSearchToggle={toggleSearch} cartCount={cartCount} onNavigate={handleNavigation} currentUser={currentUser} onLogout={handleLogout} onAuthModalOpen={toggleAuthModal}/>
                {isMobileMenuOpen && <MobileMenu onNavigate={handleNavigation} currentUser={currentUser} onLogout={handleLogout} onAuthModalOpen={toggleAuthModal} />}

                <main className="container mx-auto px-6 py-12">
                    {renderPage()}
                </main>

                <Footer onNavigate={handleNavigation} />
            </div>
        </>
    );
}
