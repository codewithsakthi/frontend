import React, { useState, useEffect, useMemo } from 'react';

// --- Data for Products ---
const initialProducts = [
    {
        id: 1,
        name: 'Aura Watch',
        description: 'Smartwatch with holographic display',
        price: 29999.00,
        images: [
            'https://placehold.co/600x600/3B82F6/FFFFFF?text=Aura+Front',
            'https://placehold.co/600x600/93C5FD/FFFFFF?text=Aura+Side',
            'https://placehold.co/600x600/BFDBFE/FFFFFF?text=Aura+Back'
        ],
        reviews: [
            { id: 1, author: 'Rohan S.', rating: 5, comment: 'Absolutely stunning display! Feels like the future.' },
            { id: 2, author: 'Priya K.', rating: 4, comment: 'Great watch, battery life is decent. A bit bulky for my wrist but the features make up for it.' }
        ]
    },
    {
        id: 2,
        name: 'Crystal Buds',
        description: 'Transparent noise-cancelling earbuds',
        price: 12499.00,
        images: [
            'https://placehold.co/600x600/EC4899/FFFFFF?text=Buds+Case',
            'https://placehold.co/600x600/F9A8D4/FFFFFF?text=Buds+Out',
            'https://placehold.co/600x600/FBCFE8/FFFFFF?text=Buds+Single'
        ],
        reviews: [
            { id: 3, author: 'Amit P.', rating: 5, comment: 'The sound quality is insane for this price. Noise cancelling is top-notch.' }
        ]
    },
    {
        id: 3,
        name: 'Ghost Keyboard',
        description: 'Mechanical keyboard with glass keys',
        price: 18999.00,
        images: [
            'https://placehold.co/600x600/10B981/FFFFFF?text=Keyboard+Top',
            'https://placehold.co/600x600/6EE7B7/FFFFFF?text=Keyboard+Angle',
            'https://placehold.co/600x600/A7F3D0/FFFFFF?text=Key+Detail'
        ],
        reviews: [
            { id: 4, author: 'Sneha M.', rating: 5, comment: 'Looks amazing on my desk and the typing feel is perfect. The clicky sound is very satisfying.' },
            { id: 5, author: 'Vikram R.', rating: 4, comment: 'Love the look, but it gets fingerprints easily. The RGB lighting is a nice touch though.' }
        ]
    },
    {
        id: 4,
        name: 'Lucid Mouse',
        description: 'Ergonomic transparent mouse',
        price: 7499.00,
        images: [
            'https://placehold.co/600x600/F59E0B/FFFFFF?text=Mouse+Top',
            'https://placehold.co/600x600/FBBF24/FFFFFF?text=Mouse+Side',
            'https://placehold.co/600x600/FDE68A/FFFFFF?text=Mouse+Grip'
        ],
        reviews: []
    },
    { id: 5, name: 'Photon Projector', description: 'Pocket-sized 8K projector', price: 59999.00, images: ['https://placehold.co/600x600/8B5CF6/FFFFFF?text=Projector'], reviews: [] },
    { id: 6, name: 'Echo Frames', description: 'Smart glasses with audio', price: 24999.00, images: ['https://placehold.co/600x600/EF4444/FFFFFF?text=Frames'], reviews: [] }
];

// --- SVG Icon Components ---
const SearchIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);
const ShoppingBagIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>);
const MenuIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>);
const XIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const StarIcon = ({ filled }) => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={filled ? "#FBBF24" : "none"} stroke={filled ? "#FBBF24" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>);
const CheckCircleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>);
const HeartIcon = ({ filled }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={filled ? 'text-pink-500' : ''}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>);


// --- Page Components ---
const HomePage = ({ onAddToCart, onProductSelect, onToggleWishlist, wishlist, onQuickView }) => (
    <>
        <section className="glass-card rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 mb-16">
            <div className="md:w-1/2 text-center md:text-left">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">Future is Crystal Clear</h1>
                <p className="text-lg text-gray-200 mb-8">Discover our new collection of premium products, designed with clarity and style. Experience the future of design today.</p>
                <button onClick={() => onProductSelect(initialProducts[0])} className="bg-white/90 text-black font-bold py-3 px-8 rounded-full hover:bg-white transition-transform duration-300 inline-block transform hover:scale-105">Shop Collection</button>
            </div>
            <div className="md:w-1/2">
                <img src="https://placehold.co/600x400/111827/FFFFFF?text=Featured+Product" alt="Featured Product" className="rounded-2xl w-full h-auto shadow-2xl" />
            </div>
        </section>
        <section>
            <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {initialProducts.slice(0, 4).map(product => (
                    <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onProductSelect={onProductSelect} onToggleWishlist={onToggleWishlist} isWishlisted={wishlist.some(item => item.id === product.id)} onQuickView={onQuickView} />
                ))}
            </div>
        </section>
    </>
);

const ShopPage = ({ onAddToCart, onProductSelect, onToggleWishlist, wishlist, onQuickView }) => {
    const [priceInput, setPriceInput] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sortBy, setSortBy] = useState(null);

    const displayedProducts = useMemo(() => {
        let products = [...initialProducts];

        // Filter by max price if set
        if (maxPrice && !isNaN(parseFloat(maxPrice))) {
            const priceLimit = parseFloat(maxPrice);
            products = products.filter(p => p.price <= priceLimit);
        }

        // Sort products if a sort order is set
        if (sortBy === 'price-asc') {
            products.sort((a, b) => a.price - b.price);
        }

        return products;
    }, [maxPrice, sortBy]);

    const handleFilter = () => {
        setMaxPrice(priceInput);
    };

    const handleSort = () => {
        setSortBy('price-asc');
    };

    const handleReset = () => {
        setPriceInput('');
        setMaxPrice('');
        setSortBy(null);
    };

    return (
        <div>
            <div className="glass-card rounded-3xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={handleSort} className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-6 rounded-full transition-colors">Sort by Price (Low-High)</button>
                <div className="flex items-center gap-2">
                    <input type="number" placeholder="Max Price" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} className="w-32 rounded-full p-2 bg-white/20 border-none focus:ring-0 text-white placeholder-gray-300"/>
                    <button onClick={handleFilter} className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-6 py-2 rounded-full transition-colors">Filter</button>
                </div>
                <button onClick={handleReset} className="text-sm hover:text-gray-300">Reset</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {displayedProducts.map(product => (
                    <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onProductSelect={onProductSelect} onToggleWishlist={onToggleWishlist} isWishlisted={wishlist.some(item => item.id === product.id)} onQuickView={onQuickView} />
                ))}
            </div>
        </div>
    );
};

const ProductDetailPage = ({ product, onAddToCart, onNavigate, onToggleWishlist, isWishlisted }) => {
    const [currentImage, setCurrentImage] = useState(product.images[0]);
    const [aiDescription, setAiDescription] = useState('');
    const [stylingTips, setStylingTips] = useState('');
    const [isLoading, setIsLoading] = useState({ description: false, styling: false });
    const [error, setError] = useState({ description: null, styling: null });

    const callGeminiAPI = async (prompt, loadingKey, errorKey, setter) => {
        // --- FIX: Added a comment explaining the need for an API key. ---
        // IMPORTANT: Add your Google Gemini API key below.
        // You can get a key from Google AI Studio: https://aistudio.google.com/
        const apiKey = "";

        if (!apiKey) {
            setError(prev => ({ ...prev, [errorKey]: "API key is missing. Please add it in ProductDetailPage.js." }));
            return;
        }
        setIsLoading(prev => ({ ...prev, [loadingKey]: true }));
        setError(prev => ({ ...prev, [errorKey]: null }));
        setter('');

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) setter(text);
            else throw new Error("Invalid response structure from API.");
        } catch (e) {
            setError(prev => ({ ...prev, [errorKey]: e.message || "An unexpected error occurred." }));
        } finally {
            setIsLoading(prev => ({ ...prev, [loadingKey]: false }));
        }
    };

    const generateDescription = () => {
        const prompt = `Write a creative, futuristic, and appealing e-commerce product description for the following item. Make it sound sleek and desirable.
        Product Name: ${product.name}
        Details: ${product.description}`;
        callGeminiAPI(prompt, 'description', 'description', setAiDescription);
    };

    const getStylingTips = () => {
        const prompt = `Give me some cool, modern styling tips for an outfit that would go well with a "${product.name}". Suggest complementary clothing items and accessories. Format the response with bullet points.`;
        callGeminiAPI(prompt, 'styling', 'styling', setStylingTips);
    };

    useEffect(() => {
        // Reset state when product changes
        setCurrentImage(product.images[0]);
        setAiDescription('');
        setStylingTips('');
        setError({ description: null, styling: null });
    }, [product]);


    return (
        <div className="glass-card rounded-3xl p-8 md:p-12">
            <button onClick={() => onNavigate('shop')} className="mb-8 text-sm hover:text-gray-300">← Back to Shop</button>
            <div className="flex flex-col md:flex-row gap-12">
                <div className="md:w-1/2">
                    <img src={currentImage} alt={product.name} className="w-full rounded-2xl shadow-2xl mb-4" />
                    <div className="flex gap-2">
                        {product.images.map((img, index) => (
                            <img key={index} src={img} alt={`${product.name} thumbnail ${index + 1}`} onClick={() => setCurrentImage(img)} className={`w-20 h-20 rounded-lg object-cover cursor-pointer border-2 ${currentImage === img ? 'border-pink-500' : 'border-transparent'}`}/>
                        ))}
                    </div>
                </div>
                <div className="md:w-1/2">
                    <div className="flex justify-between items-start">
                        <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
                        <button onClick={() => onToggleWishlist(product)} className="p-2 -mr-2 -mt-2"><HeartIcon filled={isWishlisted} /></button>
                    </div>
                    <p className="text-gray-300 text-lg mb-6">{product.description}</p>
                    <p className="font-bold text-3xl mb-8">₹{product.price.toLocaleString('en-IN')}</p>
                    <div className="flex flex-col gap-4">
                        <button onClick={() => onAddToCart(product)} className="w-full bg-pink-500 text-white font-bold py-3 rounded-full hover:bg-pink-600 transition-colors">Add to Cart</button>
                        <button onClick={generateDescription} disabled={isLoading.description} className="w-full bg-white/10 text-white font-semibold py-3 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50">
                            {isLoading.description ? 'Generating...' : '✨ Generate AI Description'}
                        </button>
                         <button onClick={getStylingTips} disabled={isLoading.styling} className="w-full bg-white/10 text-white font-semibold py-3 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50">
                            {isLoading.styling ? 'Thinking...' : '✨ Get Styling Tips'}
                        </button>
                    </div>
                    {error.description && <p className="text-red-400 text-xs mt-4">{error.description}</p>}
                    {aiDescription && <div className="mt-6 p-4 bg-black/20 rounded-lg"><h4 className="font-bold text-sm mb-2">AI Generated Description:</h4><p className="text-gray-300 text-sm whitespace-pre-wrap">{aiDescription}</p></div>}
                    {error.styling && <p className="text-red-400 text-xs mt-4">{error.styling}</p>}
                    {stylingTips && <div className="mt-6 p-4 bg-black/20 rounded-lg"><h4 className="font-bold text-sm mb-2">Styling Tips:</h4><p className="text-gray-300 text-sm whitespace-pre-wrap">{stylingTips}</p></div>}
                </div>
            </div>
            <ProductReviews reviews={product.reviews} />
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
    const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

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
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="MM / YY" className="p-3 bg-white/10 rounded-lg border-none focus:ring-2 focus:ring-pink-500" />
                            <input type="text" placeholder="CVC" className="p-3 bg-white/10 rounded-lg border-none focus:ring-2 focus:ring-pink-500" />
                        </div>
                    </div>
                    <div className="mt-8 flex justify-between"><button onClick={handleBack} className="bg-white/20 text-white font-bold py-3 px-8 rounded-full hover:bg-white/30">Back</button><button onClick={handleNext} className="bg-pink-500 text-white font-bold py-3 px-8 rounded-full hover:bg-pink-600">Next: Review</button></div>
                </div>
            )}
            {step === 3 && (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Review Your Order</h2>
                    <div className="space-y-2 bg-black/20 p-4 rounded-lg mb-6">
                        {cartItems.map(item => (<div key={item.id} className="flex justify-between"><span>{item.name} x {item.quantity}</span><span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span></div>))}
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
            <div className="relative">
                <img onClick={() => onProductSelect(product)} src={product.images[0]} alt={product.name} className="w-full h-52 object-cover transform group-hover:scale-110 transition-transform duration-500 cursor-pointer" />
                <div className="absolute top-0 left-0 w-full h-full bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <button onClick={(e) => { e.stopPropagation(); onQuickView(product); }} className="bg-white/90 text-black font-semibold py-2 px-6 rounded-full hover:bg-white transition-colors">Quick View</button>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onToggleWishlist(product); }} className="absolute top-2 right-2 p-2 bg-black/30 rounded-full hover:bg-pink-500/50 transition-colors"><HeartIcon filled={isWishlisted} /></button>
            </div>
            <div className="p-5 flex flex-col flex-grow">
                <h3 onClick={() => onProductSelect(product)} className="font-semibold text-lg cursor-pointer">{product.name}</h3>
                <p className="font-bold text-xl mt-2">₹{product.price.toLocaleString('en-IN')}</p>
                 <button onClick={(e) => { e.stopPropagation(); onAddToCart(product); }} className="w-full mt-auto bg-pink-500/50 text-white font-semibold py-2 px-4 rounded-lg hover:bg-pink-500/80 transition-colors">Add to Cart</button>
            </div>
        </div>
    );
};

const StarRating = ({ rating }) => (
    <div className="flex">
        {[...Array(5)].map((_, i) => <StarIcon key={i} filled={i < rating} />)}
    </div>
);

const ProductReviews = ({ reviews }) => {
    if (!reviews || reviews.length === 0) {
        return (
            <div className="mt-12 border-t border-white/10 pt-8">
                <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
                <p className="text-gray-400">No reviews yet for this product.</p>
            </div>
        );
    }
    return (
        <div className="mt-12 border-t border-white/10 pt-8">
            <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
            <div className="space-y-6">
                {reviews.map(review => (
                    <div key={review.id} className="glass-card p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold">{review.author}</h3>
                            <StarRating rating={review.rating} />
                        </div>
                        <p className="text-gray-300">{review.comment}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Header = ({ onMenuToggle, onCartToggle, onSearchToggle, cartCount, onNavigate, currentUser, onLogout, onAuthModalOpen }) => (
    <header className="glass-card sticky top-4 mx-auto max-w-7xl rounded-2xl z-50 my-4">
        <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="text-2xl font-bold tracking-wider">
                    <button onClick={() => onNavigate('home')}>GLASSTOPIA</button>
                </div>
                <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
                    <button onClick={() => onNavigate('home')} className="hover:text-gray-300 transition-colors duration-300">Home</button>
                    <button onClick={() => onNavigate('shop')} className="hover:text-gray-300 transition-colors duration-300">Shop</button>
                    <button onClick={() => onNavigate('wishlist')} className="hover:text-gray-300 transition-colors duration-300">Wishlist</button>
                    <button onClick={() => onNavigate('about')} className="hover:text-gray-300 transition-colors duration-300">About</button>
                    <button onClick={() => onNavigate('contact')} className="hover:text-gray-300 transition-colors duration-300">Contact</button>
                </nav>
                <div className="flex items-center space-x-6">
                    <button onClick={onSearchToggle} className="hover:text-gray-300 transition-colors duration-300"><SearchIcon /></button>
                    <button onClick={onCartToggle} className="hover:text-gray-300 transition-colors duration-300 relative">
                        <ShoppingBagIcon />
                        {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">{cartCount}</span>}
                    </button>
                    {currentUser ? (
                        <div className="hidden sm:flex items-center gap-4">
                            <span>Welcome, {currentUser.name}!</span>
                            <button onClick={onLogout} className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full">Logout</button>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center space-x-4">
                            <button onClick={() => onAuthModalOpen('login')} className="text-sm hover:text-gray-300">Login</button>
                            <button onClick={() => onAuthModalOpen('signup')} className="bg-pink-500 text-white font-bold text-sm py-2 px-4 rounded-full hover:bg-pink-600">Sign Up</button>
                        </div>
                    )}
                    <button className="md:hidden hover:text-gray-300 transition-colors duration-300" onClick={onMenuToggle}><MenuIcon /></button>
                </div>
            </div>
        </div>
    </header>
);

const MobileMenu = ({ onNavigate, currentUser, onLogout, onAuthModalOpen }) => (
    <div className="glass-card md:hidden mx-auto max-w-7xl rounded-2xl -mt-4 mb-4">
        <nav className="flex flex-col space-y-4 text-sm font-medium p-6">
            <button onClick={() => onNavigate('home')} className="text-left hover:text-gray-300 transition-colors duration-300">Home</button>
            <button onClick={() => onNavigate('shop')} className="text-left hover:text-gray-300 transition-colors duration-300">Shop</button>
            <button onClick={() => onNavigate('wishlist')} className="text-left hover:text-gray-300 transition-colors duration-300">Wishlist</button>
             <button onClick={() => onNavigate('about')} className="text-left hover:text-gray-300 transition-colors duration-300">About</button>
            <button onClick={() => onNavigate('contact')} className="text-left hover:text-gray-300 transition-colors duration-300">Contact</button>
            <div className="border-t border-white/10 my-2"></div>
            {currentUser ? (
                <>
                    <p className="text-left">Welcome, {currentUser.name}!</p>
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
    const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    const handleCheckout = () => {
        onToggle(); // Close cart modal
        onNavigate('checkout');
    };

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
                                            <img src={item.images[0]} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                                            <div>
                                                <h3 className="font-semibold">{item.name}</h3>
                                                <p className="text-gray-300 text-sm">₹{item.price.toLocaleString('en-IN')}</p>
                                            </div>
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
                                <button onClick={handleCheckout} className="w-full bg-pink-500 text-white font-bold py-3 mt-6 rounded-full hover:bg-pink-600 transition-colors">
                                    Proceed to Checkout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SearchModal = ({ isOpen, onToggle, onProductSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const searchResults = searchTerm
        ? initialProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];

    const handleSelect = (product) => {
        onProductSelect(product);
        onToggle(); // Close modal on selection
    };

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
                                <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded object-cover" />
                                {product.name}
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
    // --- FIX: Replaced alert() with inline error state ---
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        let result;
        if (mode === 'login') {
            result = await onLogin({ email, password });
        } else {
            result = await onSignUp({ name, email, password });
        }
        if (result) {
            setError(result);
        }
    };

    if (!mode) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onToggle}>
            <div className="glass-card rounded-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">{mode === 'login' ? 'Login' : 'Sign Up'}</h2>
                        <button type="button" onClick={onToggle} className="text-white hover:text-gray-300"><XIcon /></button>
                    </div>
                    <div className="space-y-4">
                        {mode === 'signup' && <input type="text" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} required className="w-full p-3 bg-white/10 rounded-lg border-none focus:ring-2 focus:ring-pink-500" />}
                        <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-3 bg-white/10 rounded-lg border-none focus:ring-2 focus:ring-pink-500" />
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-3 bg-white/10 rounded-lg border-none focus:ring-2 focus:ring-pink-500" />
                    </div>
                    {error && <p className="text-red-400 text-xs mt-4 text-center">{error}</p>}
                    <button type="submit" className="w-full mt-6 bg-pink-500 text-white font-bold py-3 rounded-full hover:bg-pink-600">{mode === 'login' ? 'Login' : 'Create Account'}</button>
                    <p className="text-center text-sm mt-4">
                        {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                        <button type="button" onClick={onSwitchMode} className="text-pink-400 hover:underline">{mode === 'login' ? 'Sign Up' : 'Login'}</button>
                    </p>
                </form>
            </div>
        </div>
    );
};

const QuickViewModal = ({ product, onToggle, onAddToCart, onProductSelect }) => {
    if (!product) return null;

    const handleViewDetails = () => {
        onToggle();
        onProductSelect(product);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onToggle}>
            <div className="glass-card rounded-2xl w-full max-w-4xl mx-4" onClick={e => e.stopPropagation()}>
                <div className="p-8 relative">
                    <button onClick={onToggle} className="absolute top-4 right-4 text-white hover:text-gray-300"><XIcon /></button>
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="md:w-1/2">
                            <img src={product.images[0]} alt={product.name} className="w-full rounded-lg" />
                        </div>
                        <div className="md:w-1/2">
                            <h2 className="text-3xl font-bold mb-2">{product.name}</h2>
                            <p className="text-gray-300 mb-4">{product.description}</p>
                            <p className="font-bold text-2xl mb-6">₹{product.price.toLocaleString('en-IN')}</p>
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

// --- FIX: Created a functional Footer component to handle navigation ---
const Footer = ({ onNavigate }) => (
     <footer className="mt-20">
        <div className="glass-card rounded-t-3xl max-w-7xl mx-auto">
            <div className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
                    <div>
                        <h3 className="font-bold text-lg mb-4">GLASSTOPIA</h3>
                        <p className="text-gray-300 text-sm">Experience design like never before.</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li><button onClick={() => onNavigate('about')} className="hover:text-white">About Us</button></li>
                            <li><button onClick={() => onNavigate('contact')} className="hover:text-white">Contact</button></li>
                            <li><button className="hover:text-white">FAQ</button></li>
                            <li><button className="hover:text-white">Shipping & Returns</button></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-4">Follow Us</h3>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li><a href="#" className="hover:text-white">Instagram</a></li>
                            <li><a href="#" className="hover:text-white">Twitter</a></li>
                            <li><a href="#" className="hover:text-white">Facebook</a></li>
                            <li><a href="#" className="hover:text-white">Pinterest</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-4">Newsletter</h3>
                        <p className="text-gray-300 text-sm mb-4">Get 10% off your first order.</p>
                        <form className="flex" onSubmit={e => e.preventDefault()}>
                            <input type="email" placeholder="Your Email" className="w-full rounded-l-lg p-2 bg-black/20 border-none focus:ring-0 text-white placeholder-gray-300" />
                            <button type="submit" className="bg-white/90 text-black font-bold px-4 rounded-r-lg hover:bg-white transition-colors">Go</button>
                        </form>
                    </div>
                </div>
                <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm text-gray-400">
                    <p>&copy; 2024 Glasstopia. All Rights Reserved.</p>
                </div>
            </div>
        </div>
    </footer>
);


// --- Main App Component ---
export default function App() {
    const [currentPage, setCurrentPage] = useState('home');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isCartOpen, setCartOpen] = useState(false);
    const [isSearchOpen, setSearchOpen] = useState(false);
    const [cartItems, setCartItems] = useState([]);
    const [authModalState, setAuthModalState] = useState(null); // 'login' or 'signup'
    const [quickViewProduct, setQuickViewProduct] = useState(null);

    // --- FIX: Implemented localStorage for user and wishlist persistence ---
    const [users, setUsers] = useState(() => {
        try {
            const savedUsers = localStorage.getItem('glasstopia_users');
            return savedUsers ? JSON.parse(savedUsers) : [];
        } catch (error) {
            return [];
        }
    });

    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('glasstopia_currentUser');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            return null;
        }
    });

    const [wishlist, setWishlist] = useState([]);

    useEffect(() => {
        localStorage.setItem('glasstopia_users', JSON.stringify(users));
    }, [users]);

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('glasstopia_currentUser', JSON.stringify(currentUser));
            // Load user-specific wishlist
            const savedWishlist = localStorage.getItem(`glasstopia_wishlist_${currentUser.email}`);
            setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);
        } else {
            localStorage.removeItem('glasstopia_currentUser');
            setWishlist([]); // Clear wishlist on logout
        }
    }, [currentUser]);

    useEffect(() => {
        // Save wishlist whenever it changes, but only if a user is logged in.
        if (currentUser) {
            localStorage.setItem(`glasstopia_wishlist_${currentUser.email}`, JSON.stringify(wishlist));
        }
    }, [wishlist, currentUser]);

    // --- FIX: Added mouse move effect for glass card glow ---
    useEffect(() => {
        const handleMouseMove = (e) => {
            const cards = document.querySelectorAll('.glass-card');
            for (const card of cards) {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            }
        };
        document.addEventListener('mousemove', handleMouseMove);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);


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

    const handlePlaceOrder = () => {
        setCartItems([]);
        handleNavigation('orderConfirmation');
    };

    const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);
    const toggleCart = () => setCartOpen(!isCartOpen);
    const toggleSearch = () => setSearchOpen(!isSearchOpen);
    const toggleAuthModal = (mode = null) => setAuthModalState(mode);
    const handleQuickView = (product) => setQuickViewProduct(product);

    const handleSignUp = (newUser) => {
        if (users.find(u => u.email === newUser.email)) {
            return "An account with this email already exists.";
        }
        setUsers([...users, newUser]);
        setCurrentUser(newUser);
        toggleAuthModal();
        return null;
    };

    const handleLogin = (credentials) => {
        const user = users.find(u => u.email === credentials.email && u.password === credentials.password);
        if (user) {
            setCurrentUser(user);
            toggleAuthModal();
            return null;
        } else {
            return "Invalid email or password.";
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };

    const addToCart = (productToAdd) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === productToAdd.id);
            if (existingItem) {
                return prevItems.map(item =>
                    item.id === productToAdd.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevItems, { ...productToAdd, quantity: 1 }];
        });
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
        } else {
            setCartItems(prevItems =>
                prevItems.map(item =>
                    item.id === productId ? { ...item, quantity: newQuantity } : item
                )
            );
        }
    };

    const toggleWishlist = (product) => {
        if (!currentUser) {
            toggleAuthModal('login');
            return;
        }
        setWishlist(prevWishlist => {
            const isWishlisted = prevWishlist.some(item => item.id === product.id);
            if (isWishlisted) {
                return prevWishlist.filter(item => item.id !== product.id);
            } else {
                return [...prevWishlist, product];
            }
        });
    };

    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    const renderPage = () => {
        if (currentPage === 'productDetail' && selectedProduct) {
            return <ProductDetailPage product={selectedProduct} onAddToCart={addToCart} onNavigate={handleNavigation} onToggleWishlist={toggleWishlist} isWishlisted={wishlist.some(item => item.id === selectedProduct.id)} />;
        }
        switch (currentPage) {
            case 'home': return <HomePage onAddToCart={addToCart} onProductSelect={handleProductSelect} onToggleWishlist={toggleWishlist} wishlist={wishlist} onQuickView={handleQuickView} />;
            case 'shop': return <ShopPage onAddToCart={addToCart} onProductSelect={handleProductSelect} onToggleWishlist={toggleWishlist} wishlist={wishlist} onQuickView={handleQuickView} />;
            case 'wishlist': return <WishlistPage wishlist={wishlist} onToggleWishlist={toggleWishlist} onAddToCart={addToCart} onProductSelect={handleProductSelect} onQuickView={handleQuickView} onNavigate={handleNavigation} />;
            case 'checkout': return <CheckoutPage cartItems={cartItems} onPlaceOrder={handlePlaceOrder} />;
            case 'orderConfirmation': return <OrderConfirmationPage onNavigate={handleNavigation} />;
            case 'about': return <PlaceholderPage title="About Us"><p>Glasstopia is a forward-thinking e-commerce platform dedicated to bringing you the most innovative and beautifully designed tech products on the market. We believe in a future where technology is not just functional, but also a seamless and elegant part of our lives.</p></PlaceholderPage>;
            case 'contact': return <PlaceholderPage title="Contact Us"><p>Have questions? We'd love to hear from you. Reach out to our team at <a href="mailto:support@glasstopia.com" className="text-pink-500 hover:underline">support@glasstopia.com</a>.</p></PlaceholderPage>;
            default: return <HomePage onAddToCart={addToCart} onProductSelect={handleProductSelect} onToggleWishlist={toggleWishlist} wishlist={wishlist} onQuickView={handleQuickView} />;
        }
    };

    return (
        <>
            <style>{`
                body { font-family: 'Inter', sans-serif; color: #e0e0e0; background: linear-gradient(45deg, #1a1a2e, #2a002a, #002a2a, #1a1a2e); background-size: 400% 400%; animation: gradientBG 15s ease infinite; }
                @keyframes gradientBG {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .glass-card {
                    position: relative;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0));
                    backdrop-filter: blur(30px);
                    -webkit-backdrop-filter: blur(30px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
                    overflow: hidden;
                }
                 .glass-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(
                        800px circle at var(--mouse-x) var(--mouse-y),
                        rgba(255, 255, 255, 0.06),
                        transparent 40%
                    );
                    opacity: 0;
                    transition: opacity 0.5s;
                    pointer-events: none; /* FIX: Ensure pseudo-element doesn't block mouse events */
                }
                .glass-card:hover::before {
                    opacity: 1;
                }
            `}</style>

            <div className="relative z-10 min-h-screen">
                <CartModal isOpen={isCartOpen} onToggle={toggleCart} cartItems={cartItems} onUpdateQuantity={updateQuantity} onNavigate={handleNavigation} />
                <SearchModal isOpen={isSearchOpen} onToggle={toggleSearch} onProductSelect={handleProductSelect} />
                <AuthModal mode={authModalState} onToggle={() => toggleAuthModal()} onLogin={handleLogin} onSignUp={handleSignUp} onSwitchMode={() => setAuthModalState(authModalState === 'login' ? 'signup' : 'login')} />
                <QuickViewModal product={quickViewProduct} onToggle={() => setQuickViewProduct(null)} onAddToCart={addToCart} onProductSelect={handleProductSelect} />

                <Header onMenuToggle={toggleMobileMenu} onCartToggle={toggleCart} onSearchToggle={toggleSearch} cartCount={cartCount} onNavigate={handleNavigation} currentUser={currentUser} onLogout={handleLogout} onAuthModalOpen={toggleAuthModal} />
                {isMobileMenuOpen && <MobileMenu onNavigate={handleNavigation} currentUser={currentUser} onLogout={handleLogout} onAuthModalOpen={toggleAuthModal} />}

                <main className="container mx-auto px-6 py-12">
                    {renderPage()}
                </main>

                <Footer onNavigate={handleNavigation} />
            </div>
        </>
    );
}