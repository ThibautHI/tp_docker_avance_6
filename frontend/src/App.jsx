import { useState, useEffect } from 'react'
import {
    ShoppingCart,
    User,
    LogOut,
    X,
    Plus,
    Minus,
    Trash2,
    Cloud,
    Package,
    CheckCircle,
    XCircle,
    Loader,
    Lock,
    Laptop,
    Smartphone,
    Headphones,
    Watch,
    Tablet,
    Keyboard,
    Monitor,
    Speaker,
    Box,
    AlertCircle,
    ClipboardList
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// Product icons mapping by category
const categoryIcons = {
    computers: Laptop,
    phones: Smartphone,
    audio: Headphones,
    wearables: Watch,
    tablets: Tablet,
    accessories: Keyboard,
    displays: Monitor,
}

const ProductIcon = ({ category, className }) => {
    const Icon = categoryIcons[category] || Box
    return <Icon className={className} />
}

function App() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [cart, setCart] = useState([])
    const [showCart, setShowCart] = useState(false)
    const [showLogin, setShowLogin] = useState(false)
    const [showOrders, setShowOrders] = useState(false)
    const [orders, setOrders] = useState([])
    const [ordersLoading, setOrdersLoading] = useState(false)
    const [loginForm, setLoginForm] = useState({ email: '', password: '' })
    const [loginError, setLoginError] = useState('')
    const [loginLoading, setLoginLoading] = useState(false)
    const [orderSuccess, setOrderSuccess] = useState(false)
    const [services, setServices] = useState({
        gateway: { status: 'loading', name: 'API Gateway', port: 8080 },
        auth: { status: 'loading', name: 'Auth Service', port: 8081 },
        products: { status: 'loading', name: 'Products API', port: 8082 },
        orders: { status: 'loading', name: 'Orders API', port: 8083 },
    })
    const [user, setUser] = useState(null)

    useEffect(() => {
        checkServices()
        fetchProducts()
    }, [])

    const checkServices = async () => {
        const endpoints = {
            gateway: `${API_URL}/health`,
            auth: `${API_URL}/api/auth/health`,
            products: `${API_URL}/api/products/health`,
            orders: `${API_URL}/api/orders/health`,
        }

        for (const [key, url] of Object.entries(endpoints)) {
            try {
                const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(3000) })
                setServices(prev => ({ ...prev, [key]: { ...prev[key], status: response.ok ? 'online' : 'offline' } }))
            } catch {
                setServices(prev => ({ ...prev, [key]: { ...prev[key], status: 'offline' } }))
            }
        }
    }

    const fetchProducts = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`${API_URL}/api/products/`, { signal: AbortSignal.timeout(5000) })
            if (response.ok) {
                const data = await response.json()
                setProducts(data)
            } else {
                setError('Erreur lors du chargement des produits')
            }
        } catch (err) {
            setError('Impossible de contacter le serveur')
            console.error('Error fetching products:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchOrders = async () => {
        if (!user) return
        setOrdersLoading(true)
        try {
            const response = await fetch(`${API_URL}/api/orders/user/${user.id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                signal: AbortSignal.timeout(5000)
            })
            if (response.ok) {
                const data = await response.json()
                setOrders(data)
            }
        } catch (err) {
            console.error('Error fetching orders:', err)
        } finally {
            setOrdersLoading(false)
        }
    }

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id)
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
            }
            return [...prev, { ...product, quantity: 1 }]
        })
    }

    const removeFromCart = (productId) => setCart(prev => prev.filter(item => item.id !== productId))

    const updateQuantity = (productId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQty = item.quantity + delta
                return newQty > 0 ? { ...item, quantity: newQty } : item
            }
            return item
        }).filter(item => item.quantity > 0))
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoginLoading(true)
        setLoginError('')

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm)
            })
            const data = await response.json()

            if (response.ok) {
                setUser(data.user)
                localStorage.setItem('token', data.token)
                setShowLogin(false)
                setLoginForm({ email: '', password: '' })
            } else {
                setLoginError(data.error || 'Erreur de connexion')
            }
        } catch {
            setLoginError('Service indisponible')
        } finally {
            setLoginLoading(false)
        }
    }

    const handleLogout = () => {
        setUser(null)
        setOrders([])
        localStorage.removeItem('token')
    }

    const handlePlaceOrder = async () => {
        if (!user) {
            setShowCart(false)
            setShowLogin(true)
            return
        }

        if (cart.length === 0) return

        try {
            const orderData = {
                user_id: user.id,
                items: cart.map(item => ({
                    product_id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                })),
                shipping_address: {
                    street: '123 Default Street',
                    city: 'Paris',
                    zip_code: '75001',
                    country: 'France'
                }
            }

            const response = await fetch(`${API_URL}/api/orders/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(orderData)
            })

            if (response.ok) {
                setCart([])
                setOrderSuccess(true)
                setTimeout(() => setOrderSuccess(false), 3000)
                setShowCart(false)
            } else {
                alert('Erreur lors de la commande')
            }
        } catch (err) {
            console.error('Error placing order:', err)
            alert('Erreur lors de la commande')
        }
    }

    const handleViewOrders = () => {
        if (!user) {
            setShowLogin(true)
            return
        }
        fetchOrders()
        setShowOrders(true)
    }

    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

    const StatusIcon = ({ status }) => {
        if (status === 'online') return <CheckCircle className="w-4 h-4 text-emerald-500" />
        if (status === 'offline') return <XCircle className="w-4 h-4 text-red-500" />
        return <Loader className="w-4 h-4 text-amber-500 animate-spin" />
    }

    const getStatusLabel = (status) => {
        const labels = {
            pending: 'En attente',
            processing: 'En cours',
            shipped: 'Expedie',
            delivered: 'Livre',
            cancelled: 'Annule'
        }
        return labels[status] || status
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Order Success Toast */}
            {orderSuccess && (
                <div className="fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Commande passee avec succes
                </div>
            )}

            {/* Header */}
            <header className="bg-surface border-b border-white/10 px-6 py-4 sticky top-0 z-40 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        <Cloud className="w-6 h-6 text-primary" />
                        CloudShop
                    </div>

                    <nav className="hidden md:flex gap-8">
                        <a href="#products" className="text-slate-400 hover:text-white transition-colors">Produits</a>
                        <button onClick={handleViewOrders} className="text-slate-400 hover:text-white transition-colors">Mes Commandes</button>
                        <a href="#status" className="text-slate-400 hover:text-white transition-colors">Status</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowCart(true)} className="btn-secondary flex items-center gap-2 relative">
                            <ShoppingCart className="w-5 h-5" />
                            <span className="hidden sm:inline">Panier</span>
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        {user ? (
                            <button onClick={handleLogout} className="btn-secondary flex items-center gap-2">
                                <User className="w-5 h-5" />
                                <span className="hidden sm:inline">{user.name}</span>
                                <LogOut className="w-4 h-4" />
                            </button>
                        ) : (
                            <button onClick={() => setShowLogin(true)} className="btn-primary flex items-center gap-2">
                                <Lock className="w-5 h-5" />
                                <span className="hidden sm:inline">Connexion</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Login Modal */}
            {showLogin && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowLogin(false)}>
                    <div className="bg-surface rounded-xl w-full max-w-md border border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-white/10">
                            <h2 className="text-lg font-semibold flex items-center gap-2"><Lock className="w-5 h-5 text-primary" />Connexion</h2>
                            <button onClick={() => setShowLogin(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleLogin} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Email</label>
                                <input type="email" value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} placeholder="admin@cloudshop.com" required className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Mot de passe</label>
                                <input type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} placeholder="password123" required className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none" />
                            </div>
                            {loginError && <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg text-sm">{loginError}</div>}
                            <button type="submit" disabled={loginLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                                {loginLoading ? <><Loader className="w-4 h-4 animate-spin" />Connexion...</> : 'Se connecter'}
                            </button>
                            <p className="text-xs text-slate-500 text-center">Test: admin@cloudshop.com / password123</p>
                        </form>
                    </div>
                </div>
            )}

            {/* Orders Modal */}
            {showOrders && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowOrders(false)}>
                    <div className="bg-surface rounded-xl w-full max-w-2xl border border-white/10 max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-white/10">
                            <h2 className="text-lg font-semibold flex items-center gap-2"><ClipboardList className="w-5 h-5 text-secondary" />Mes Commandes</h2>
                            <button onClick={() => setShowOrders(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-96">
                            {ordersLoading ? (
                                <div className="flex justify-center py-8"><Loader className="w-8 h-8 animate-spin text-primary" /></div>
                            ) : orders.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Aucune commande</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orders.map(order => (
                                        <div key={order.id} className="bg-background rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="text-xs text-slate-500">Commande #{order.id.slice(0, 8)}</span>
                                                    <p className="font-semibold">{order.total.toFixed(2)} EUR</p>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        order.status === 'shipped' ? 'bg-blue-500/20 text-blue-400' :
                                                            order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                                                                'bg-amber-500/20 text-amber-400'
                                                    }`}>
                                                    {getStatusLabel(order.status)}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-400">
                                                {order.items.map((item, i) => (
                                                    <span key={i}>{item.name} x{item.quantity}{i < order.items.length - 1 ? ', ' : ''}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Cart Modal */}
            {showCart && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCart(false)}>
                    <div className="bg-surface rounded-xl w-full max-w-lg border border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-white/10">
                            <h2 className="text-lg font-semibold flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-secondary" />Votre Panier</h2>
                            <button onClick={() => setShowCart(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        {cart.length === 0 ? (
                            <div className="p-8 text-center">
                                <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400 mb-4">Votre panier est vide</p>
                                <button onClick={() => setShowCart(false)} className="btn-primary">Continuer vos achats</button>
                            </div>
                        ) : (
                            <>
                                <div className="max-h-64 overflow-y-auto p-4 space-y-3">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                                                <ProductIcon category={item.category} className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-sm">{item.name}</h4>
                                                <p className="text-xs text-slate-400">{item.price} EUR</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 bg-surface rounded flex items-center justify-center hover:bg-surface-hover"><Minus className="w-3 h-3" /></button>
                                                <span className="w-6 text-center text-sm">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 bg-surface rounded flex items-center justify-center hover:bg-surface-hover"><Plus className="w-3 h-3" /></button>
                                                <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 bg-red-500/10 rounded flex items-center justify-center hover:bg-red-500/20 text-red-400"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 border-t border-white/10">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="font-medium">Total:</span>
                                        <span className="text-2xl font-bold text-secondary">{cartTotal.toFixed(2)} EUR</span>
                                    </div>
                                    <button onClick={handlePlaceOrder} className="btn-primary w-full">
                                        {user ? `Commander (${cartCount} articles)` : 'Connectez-vous pour commander'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Hero */}
            <section className="py-20 px-6 text-center bg-gradient-to-b from-primary/10 to-transparent">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Bienvenue sur CloudShop
                </h1>
                <p className="text-lg text-slate-400 max-w-xl mx-auto mb-8">
                    Plateforme e-commerce moderne avec architecture microservices Cloud Native.
                </p>
                <button onClick={() => document.getElementById('products').scrollIntoView({ behavior: 'smooth' })} className="btn-primary">
                    Explorer les produits
                </button>
            </section>

            {/* Products */}
            <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
                <section id="products">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Package className="w-6 h-6 text-primary" />Nos Produits</h2>

                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Loader className="w-12 h-12 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
                            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                            <p className="text-red-400 mb-4">{error}</p>
                            <button onClick={fetchProducts} className="btn-primary">Reessayer</button>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>Aucun produit disponible</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map(product => (
                                <div key={product.id} className="bg-surface rounded-xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all hover:-translate-y-1 hover:shadow-xl">
                                    <div className="h-40 bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                        <ProductIcon category={product.category} className="w-16 h-16 text-white" />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold mb-1">{product.name}</h3>
                                        <p className="text-sm text-slate-400 mb-3">{product.description}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xl font-bold text-secondary">{product.price} EUR</span>
                                            <button onClick={() => addToCart(product)} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors">
                                                <Plus className="w-4 h-4" />Ajouter
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Status */}
                <section id="status" className="mt-16 bg-surface rounded-xl p-6 border border-white/5">
                    <h2 className="text-xl font-bold mb-4">Status des Services</h2>
                    <p className="text-slate-400 text-sm mb-4">Architecture microservices - SLO 99.9%</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(services).map(([key, service]) => (
                            <div key={key} className="bg-background p-4 rounded-lg flex items-center gap-3">
                                <StatusIcon status={service.status} />
                                <div>
                                    <h4 className="text-sm font-medium">{service.name}</h4>
                                    <p className="text-xs text-slate-500">Port {service.port}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-surface border-t border-white/5 py-6 text-center text-slate-500 text-sm">
                CloudShop 2024 - Docker - Kubernetes - GitOps - Observability
            </footer>
        </div>
    )
}

export default App
