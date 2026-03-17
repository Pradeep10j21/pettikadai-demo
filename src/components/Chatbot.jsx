import React, { useState, useEffect, useRef } from 'react';
import { Send, MapPin, ShoppingBag, TrendingUp, Headset, Sparkles, Bot, ShoppingCart, RotateCcw, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Carousel from './Carousel';
import CartPanel from './CartPanel';
import OrderTracker from './OrderTracker';
import ProductDetail from './ProductDetail';
import OrderBill from './OrderBill';
import menuData from '../data/menuData.json';

const initialMessage = {
  id: 1,
  type: 'bot',
  text: "Vanakkam! Welcome to Pettikadai. I'm here to help you find your perfect savory treats today! 🙏",
  showActions: true
};

const renderText = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const Chatbot = () => {
  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [inventory, setInventory] = useState({});
  const [currentModel, setCurrentModel] = useState({
    id: 'default',
    name: 'Llama 3.3 (Groq)',
    provider: 'groq',
    cost: { in: 0, out: 0 }
  });
  const messagesEndRef = useRef(null);

  // Load history and auto-dismiss splash
  useEffect(() => {
    const savedHistory = localStorage.getItem('pettikadai_history');
    if (savedHistory) setOrderHistory(JSON.parse(savedHistory));

    const savedInventory = localStorage.getItem('pettikadai_inventory');
    if (savedInventory) {
      setInventory(JSON.parse(savedInventory));
    } else {
      // Initialize from menuData
      const initialStock = {};
      menuData.categories.forEach(cat => {
        cat.items.forEach(item => {
          initialStock[item.name] = item.stock || 50;
        });
      });
      setInventory(initialStock);
      localStorage.setItem('pettikadai_inventory', JSON.stringify(initialStock));
    }
    
    const timer = setTimeout(() => setShowSplash(false), 2800);
    return () => clearTimeout(timer);
  }, []);

  const handleRestart = () => {
    setMessages([{ ...initialMessage, id: Date.now() }]);
    setCart([]);
    setShowCart(false);
    setInput('');
    setIsTyping(false);
    setShowSplash(true);
    setTimeout(() => setShowSplash(false), 2800);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ── Cart helpers ──
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.name === item.name);
      if (existing) {
        return prev.map(c => c.item.name === item.name ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const updateQty = (name, qty) => {
    setCart(prev => prev.map(c => c.item.name === name ? { ...c, qty } : c));
  };

  const removeFromCart = (name) => {
    setCart(prev => prev.filter(c => c.item.name !== name));
  };

  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);

  const handlePlaceOrder = () => {
    const subtotal = cart.reduce((sum, c) => sum + c.item.price * c.qty, 0);
    const orderLines = cart.map(c => `• ${c.item.name} × ${c.qty} — ₹${c.item.price * c.qty}`).join('\n');

    const summaryMsg = {
      id: Date.now(),
      type: 'bot',
      text: `🎉 Order placed successfully!`,
      isOrderSummary: true,
      orderData: {
        cart: [...cart],
        subtotal: subtotal,
        orderId: Math.floor(100000 + Math.random() * 900000),
        timestamp: new Date().toISOString()
      }
    };

    setMessages(prev => [...prev, summaryMsg]);
    
    // Deduct Inventory
    setInventory(prev => {
      const updated = { ...prev };
      cart.forEach(c => {
        if (updated[c.item.name]) {
          updated[c.item.name] = Math.max(0, updated[c.item.name] - c.qty);
        }
      });
      localStorage.setItem('pettikadai_inventory', JSON.stringify(updated));
      return updated;
    });

    // Save to History
    const newHistory = [summaryMsg.orderData, ...orderHistory].slice(0, 10);
    setOrderHistory(newHistory);
    localStorage.setItem('pettikadai_history', JSON.stringify(newHistory));

    setCart([]);
    setShowCart(false);
  };

  // ── Chat helpers ──
  const handleActionClick = (action) => {
    let userMsg = "";
    if (action === 'track') userMsg = "Track my savory order";
    if (action === 'shop') userMsg = "Show me the menu";
    if (action === 'popular') userMsg = "Show popular items";
    if (action === 'support') userMsg = "Contact food support";

    handleSend(userMsg);
  };

  const handleSend = async (text, val = null) => {
    const msgText = text || input;
    if (!msgText.trim()) return;

    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: msgText }]);
    if (!text) setInput('');
    setIsTyping(true);

    const processVal = val || msgText.toLowerCase();

    setTimeout(async () => {
      await processResponse(processVal);
      setIsTyping(false);
    }, 1000);
  };

  const processResponse = async (query) => {
    let response = { id: Date.now(), type: 'bot', text: "" };
    const lower = typeof query === 'string' ? query.toLowerCase() : "";

    const menuKeywords = ['menu', 'shop', 'eat', 'buy', 'categories', 'snacks'];
    if (lower.includes('menu')) {
      response.text = "Our pantry is full of delight! Which category interests you?";
      response.options = [
        { label: "Murukku & Chakli", value: "murukku_chakli" },
        { label: "Mixture & Chivda", value: "mixture_chivda" },
        { label: "Vadams & Papads", value: "vadams_papads" },
        { label: "Fried Snacks", value: "fried_pakodas" },
        { label: "Podi & Chutney", value: "podi_chutney" },
        { label: "Sweets", value: "sweets" }
      ];
    } 
    // ── 2. Admin Portal ──
    else if (lower === 'pkadmin786') {
      response.text = "🔐 **Admin Portal Accessed.**\nWelcome back, Master. What would you like to check?";
      response.options = [
        { label: "View Inventory", value: "admin_inventory" },
        { label: "Recent Orders", value: "admin_orders" }
      ];
    } else if (lower === 'admin_inventory') {
      response.text = "📦 **Comprehensive Inventory Dashboard**";
      const allItems = menuData.categories.flatMap(c => c.items);
      response.inventoryData = Object.entries(inventory).map(([name, qty]) => {
        const item = allItems.find(i => i.name === name);
        return { 
          name, 
          qty, 
          category: item?.category || 'General',
          price: item?.price || 0
        };
      });
    } else if (lower === 'admin_orders') {
      if (orderHistory.length > 0) {
        response.text = "📋 **Record of Recent Orders:**";
        response.showHistory = true;
      } else {
        response.text = "No orders have been placed in this session yet.";
      }
    }
    // ── 3. Categories ──
    else if (menuData.categories.some(c => c.id === query || c.id === lower)) {
      const category = menuData.categories.find(c => c.id === query || c.id === lower);
      response.text = `Here is our ${category.name} collection:`;
      response.carousel = category.items.map(item => ({
        ...item,
        image: category.id === 'sweets' ? '/images/sweet.png' : 
               (item.name.toLowerCase().includes('murukku') ? '/images/butter_murukku.png' : 
                (item.name.toLowerCase().includes('mixture') ? '/images/mixture.png' : '/images/kaaram.png'))
      }));
    } 
    // ── 3. Tracking ──
    else if ((lower.includes('track') && lower !== 'track_live') || lower.includes('order status') || (query && query.action === 'track')) {
      if (orderHistory.length > 0) {
        response.text = "What would you like to do?";
        response.options = [
          { label: "See Order History", value: "see_history" },
          { label: "Track Live Order", value: "track_live" }
        ];
      } else {
        response.text = "Please enter your 6-digit Order ID to track your savory treats! (e.g., '123456')";
        response.showActions = false;
      }
    } else if (lower === 'see_history' || lower === 'order history' || lower === 'my orders') {
      if (orderHistory.length > 0) {
        response.text = "I found your recent orders! 📦 Click any to view the receipt.";
        response.showHistory = true;
      } else {
        response.text = "You don't have any recent orders yet.";
      }
    } else if (lower === 'track_live' || lower === 'live order') {
      response.text = "Please enter your 6-digit Order ID to track your savory treats! (e.g., '123456')";
      response.showActions = false;
    } else if (/^\d{3,}$/.test(query.trim())) {
      const orderId = query.trim();
      const step = Math.floor(Math.random() * 4);
      response.text = `Here's the tracking status for your order:`;
      response.tracker = { orderId, currentStep: step };
    } else if (lower.includes('popular') || lower.includes('bestseller') || lower.includes('best seller')) {
      const popularNames = ['Butter Murukku', 'Madras Mixture', 'Banana Chips', 'Onion Pakoda', 'Idli Podi', 'Mixture Ladoo'];
      const allItems = menuData.categories.flatMap(c => c.items);
      const popularItems = popularNames.map(name => allItems.find(i => i.name === name)).filter(Boolean).map(item => ({
        ...item,
        image: item.name.toLowerCase().includes('murukku') ? '/images/butter_murukku.png' :
               item.name.toLowerCase().includes('mixture') ? '/images/mixture.png' :
               item.name.toLowerCase().includes('sweet') || item.name.toLowerCase().includes('ladoo') ? '/images/sweet.png' : '/images/kaaram.png'
      }));
      response.text = "🔥 Here are our bestsellers — the crowd favorites!";
      response.carousel = popularItems;
    } else if (
      lower.includes('try') || lower.includes('suggest') || lower.includes('recommend') || 
      lower.includes('something') || lower.includes('what should') || lower.includes('surprise')
    ) {
      const allItems = menuData.categories.flatMap(c => c.items);

      // Detect category or preference keywords
      const categoryMap = {
        'spicy': items => items.filter(i => i.spiceLevel >= 4),
        'hot': items => items.filter(i => i.spiceLevel >= 4),
        'mild': items => items.filter(i => i.spiceLevel <= 1),
        'light': items => items.filter(i => i.spiceLevel <= 1),
        'sweet': items => items.filter(i => i.category?.toLowerCase().includes('sweet') || i.spiceLevel === 0),
        'crunchy': items => items.filter(i => i.description?.toLowerCase().includes('crunchy') || i.description?.toLowerCase().includes('crisp')),
        'crispy': items => items.filter(i => i.description?.toLowerCase().includes('crispy') || i.description?.toLowerCase().includes('crisp') || i.description?.toLowerCase().includes('fried')),
        'murukku': items => items.filter(i => i.category?.toLowerCase().includes('murukku')),
        'snack': items => items.filter(i => i.category?.toLowerCase().includes('fried') || i.category?.toLowerCase().includes('snack')),
        'powder': items => items.filter(i => i.category?.toLowerCase().includes('podi')),
        'podi': items => items.filter(i => i.category?.toLowerCase().includes('podi')),
        'chips': items => items.filter(i => i.name?.toLowerCase().includes('chips') || i.name?.toLowerCase().includes('vadam')),
        'healthy': items => items.filter(i => i.name?.toLowerCase().includes('flax') || i.description?.toLowerCase().includes('nutritious')),
        'fried': items => items.filter(i => i.category?.toLowerCase().includes('fried')),
        'new': items => items.sort(() => Math.random() - 0.5),
      };

      let matchedItems = [];
      let matchedKeyword = '';

      for (const [keyword, filterFn] of Object.entries(categoryMap)) {
        if (lower.includes(keyword)) {
          matchedItems = filterFn([...allItems]);
          matchedKeyword = keyword;
          break;
        }
      }

      // If no specific preference detected, pick random items across categories
      if (matchedItems.length === 0) {
        matchedItems = [...allItems].sort(() => Math.random() - 0.5);
        matchedKeyword = 'random';
      }

      const itemsToShow = matchedItems.slice(0, 5).map(item => ({
        ...item,
        image: item.name?.toLowerCase().includes('murukku') ? '/images/butter_murukku.png' :
               item.name?.toLowerCase().includes('mixture') ? '/images/mixture.png' :
               item.category?.toLowerCase().includes('sweet') ? '/images/sweet.png' : '/images/kaaram.png'
      }));

      const messages = {
        'spicy': "🌶️ Love the heat? Here are our spiciest picks!",
        'hot': "🌶️ Love the heat? Here are our spiciest picks!",
        'mild': "😌 Something gentle on the palate — here are our mildest treats!",
        'light': "😌 Something light and lovely — check these out!",
        'sweet': "🍬 Got a sweet tooth? You'll love these!",
        'crunchy': "🥜 Craving some crunch? These are SUPER satisfying!",
        'crispy': "✨ Crispy & golden — these are irresistible!",
        'murukku': "🌀 Murukku lover? You're in for a treat!",
        'snack': "🍟 Perfect snack picks — try these!",
        'powder': "🧂 Our podis & dry chutneys are game-changers!",
        'podi': "🧂 Our podis add magic to any meal!",
        'chips': "🍌 Chips & vadams — the perfect crispy companions!",
        'healthy': "🌿 Healthy & tasty — the best of both worlds!",
        'fried': "🍟 Golden & fried to perfection — dig in!",
        'new': "🎲 Here's a fun mix just for you!",
        'random': "🎉 Here are some handpicked goodies just for you!"
      };

      response.text = messages[matchedKeyword] || "🎉 Here are some amazing picks for you!";
      response.carousel = itemsToShow;
    } 
    // ── 4. DeepInfra Testing Mode ──
    else if (lower === 'deepinfra') {
      const deepModels = [
        { id: 'zai-org/GLM-5', name: 'GLM-5', in: 0.41, out: 2.56 },
        { id: 'zai-org/GLM-4.7-Flash', name: 'GLM-4.7 Flash', in: 0.02, out: 0.40 },
        { id: 'zai-org/GLM-4.6', name: 'GLM-4.6', in: 0.43, out: 1.74 },
        { id: 'zai-org/GLM-4.6V', name: 'GLM-4.6V', in: 0.30, out: 0.90 },
        { id: 'google/gemma-3-27b-it', name: 'Gemma 3 27B', in: 0.08, out: 0.16 },
        { id: 'google/gemma-3-12b-it', name: 'Gemma 3 12B', in: 0.04, out: 0.13 },
        { id: 'google/gemma-3-4b-it', name: 'Gemma 3 4B', in: 0.04, out: 0.08 },
        { id: 'deepseek-ai/DeepSeek-V3.2', name: 'DeepSeek V3.2', in: 0.26, out: 0.38 },
        { id: 'deepseek-ai/DeepSeek-R1-0528', name: 'DeepSeek R1-0528', in: 0.50, out: 2.15 },
        { id: 'deepseek-ai/DeepSeek-R1-0528-Turbo', name: 'DeepSeek R1-0528-Turbo', in: 0.40, out: 1.80 },
        { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', in: 0.38, out: 0.89 },
        { id: 'deepseek-ai/DeepSeek-V3-0324', name: 'DeepSeek V3-0324', in: 0.35, out: 0.85 },
        { id: 'deepseek-ai/DeepSeek-V3.1', name: 'DeepSeek V3.1', in: 0.25, out: 0.80 },
        { id: 'deepseek-ai/DeepSeek-V3.1-Terminus', name: 'DeepSeek V3.1-Terminus', in: 0.21, out: 0.79 },
        { id: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B', name: 'DeepSeek R1 70B', in: 0.70, out: 0.80 },
        { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', name: 'Llama 3.1 8B Turbo', in: 0.02, out: 0.03 }
      ];
      response.text = "🛠️ **DeepInfra Testing Mode**\nSelect a model to switch the AI provider. Current responses will use this selection.";
      response.options = deepModels.map(m => ({
        label: `${m.name} ($${m.in}/$${m.out})`,
        value: `set_model_${m.id}`
      }));
    } 
    else if (lower.startsWith('set_model_')) {
      const modelId = query.split('set_model_')[1];
      const deepModels = [
        { id: 'zai-org/GLM-5', name: 'GLM-5', in: 0.41, out: 2.56 },
        { id: 'zai-org/GLM-4.7-Flash', name: 'GLM-4.7 Flash', in: 0.02, out: 0.40 },
        { id: 'zai-org/GLM-4.6', name: 'GLM-4.6', in: 0.43, out: 1.74 },
        { id: 'zai-org/GLM-4.6V', name: 'GLM-4.6V', in: 0.30, out: 0.90 },
        { id: 'google/gemma-3-27b-it', name: 'Gemma 3 27B', in: 0.08, out: 0.16 },
        { id: 'google/gemma-3-12b-it', name: 'Gemma 3 12B', in: 0.04, out: 0.13 },
        { id: 'google/gemma-3-4b-it', name: 'Gemma 3 4B', in: 0.04, out: 0.08 },
        { id: 'deepseek-ai/DeepSeek-V3.2', name: 'DeepSeek V3.2', in: 0.26, out: 0.38 },
        { id: 'deepseek-ai/DeepSeek-R1-0528', name: 'DeepSeek R1-0528', in: 0.50, out: 2.15 },
        { id: 'deepseek-ai/DeepSeek-R1-0528-Turbo', name: 'DeepSeek R1-0528-Turbo', in: 0.40, out: 1.80 },
        { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', in: 0.38, out: 0.89 },
        { id: 'deepseek-ai/DeepSeek-V3-0324', name: 'DeepSeek V3-0324', in: 0.35, out: 0.85 },
        { id: 'deepseek-ai/DeepSeek-V3.1', name: 'DeepSeek V3.1', in: 0.25, out: 0.80 },
        { id: 'deepseek-ai/DeepSeek-V3.1-Terminus', name: 'DeepSeek V3.1-Terminus', in: 0.21, out: 0.79 },
        { id: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B', name: 'DeepSeek R1 70B', in: 0.70, out: 0.80 },
        { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', name: 'Llama 3.1 8B Turbo', in: 0.02, out: 0.03 }
      ];
      const selected = deepModels.find(m => m.id === modelId);
      if (selected) {
        setCurrentModel({
          id: selected.id,
          name: selected.name,
          provider: 'deepinfra',
          cost: { in: selected.in, out: selected.out }
        });
        response.text = `✅ **Switched to ${selected.name}** via DeepInfra.\nAll subsequent RAG queries will use this model.`;
      }
    }
    else if (lower === 'deepmodel') {
      response.text = `📡 **Active Model Status**\n\n- **Model**: ${currentModel.name}\n- **ID**: \`${currentModel.id}\`\n- **Provider**: ${currentModel.provider.toUpperCase()}\n- **Input Cost**: $${currentModel.cost.in}/1M tokens\n- **Output Cost**: $${currentModel.cost.out}/1M tokens`;
    }
    else if (lower === 'support' || lower === 'contact support' || lower === 'help support') {
      response.text = "You can reach our food support team at support@pettikadai.com or call us at +91 98765 43210.";
    } else {
      const allItems = menuData.categories.flatMap(c => c.items);
      
      // Filter out common conversational words
      const stopWords = ['can', 'you', 'give', 'me', 'some', 'the', 'a', 'an', 'is', 'for', 'want', 'like', 'show', 'have', 'do', 'i', 'get'];
      const searchTerms = lower.split(' ').filter(word => !stopWords.includes(word) && word.length > 2);
      
      const foundItems = allItems.filter(item => {
        const itemNameLower = item.name.toLowerCase();
        if (lower.includes(itemNameLower)) return true;
        if (searchTerms.length > 0 && searchTerms.some(term => itemNameLower.includes(term))) return true;
        return false;
      });
      
      if (foundItems.length > 0) {
        const itemsToShow = foundItems.slice(0, 5);
        if (itemsToShow.length === 1) {
          const foundItem = itemsToShow[0];
          response.text = `**${foundItem.name}**: ${foundItem.description}\n\nPrice: ₹${foundItem.price} / ${foundItem.unit}`;
        } else {
          response.text = `I found a few items that match your request!`;
        }
        response.carousel = itemsToShow.map(item => ({
          ...item,
          image: item.name.toLowerCase().includes('murukku') ? '/images/butter_murukku.png' :
                 item.name.toLowerCase().includes('mixture') ? '/images/mixture.png' :
                 item.name.toLowerCase().includes('sweet') || item.name.toLowerCase().includes('ladoo') ? '/images/sweet.png' : '/images/kaaram.png'
        }));
      } else {
        // Fallback to RAG Backend
        try {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
          const res = await fetch(`${backendUrl}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              query: lower,
              model: currentModel.id !== 'default' ? currentModel.id : undefined,
              provider: currentModel.id !== 'default' ? currentModel.provider : undefined
            })
          });
          const data = await res.json();
          response.text = data.answer || "I'm not sure about that. Try asking for the 'menu' or about a specific category like 'Murukku'!";
        } catch (error) {
          console.error("RAG Backend error:", error);
          response.text = "I'm having a bit of trouble connecting to my knowledge base, but I can still show you our menu! Just say 'menu'.";
        }
      }
    }

    setMessages(prev => [...prev, response]);
  };

  return (
    <div className="chatbot-container">
      {/* ── Splash Screen ── */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            className="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="splash-logo"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12, stiffness: 100 }}
            >
              <Sparkles size={48} />
            </motion.div>
            <motion.h1
              className="splash-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              Pettikadai
            </motion.h1>
            <motion.p
              className="splash-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              Traditional Savory Shop
            </motion.p>
            <motion.div
              className="splash-loader"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.4, duration: 1.2, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="chat-header">
        <div className="header-title">
          <Sparkles size={24} />
          <h2>Pettikadai Guide</h2>
        </div>
        <div className="header-right">
          <button className="cart-header-btn" onClick={() => setShowCart(true)}>
            <ShoppingCart size={20} />
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </button>
          <button className="cart-header-btn" title="Restart" onClick={handleRestart}>
            <RotateCcw size={18} />
          </button>
          <div className="live-indicator">
            <div className="live-dot"></div>
            Live
          </div>
        </div>
      </div>

      <div className="chat-messages">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`message-wrapper ${msg.type}`}
            >
              {msg.type === 'bot' && (
                <div className="bot-avatar">
                  <Bot size={14} color="white" />
                </div>
              )}
              
              <div className={`message ${msg.type} ${msg.isOrderSummary ? 'order-summary' : ''}`}>
                {renderText(msg.text)}
                
                {msg.showActions && (
                  <div className="actions-grid">
                    <button className="action-btn" onClick={() => handleActionClick('track')}>
                      <MapPin />
                      <span>Track Order</span>
                    </button>
                    <button className="action-btn" onClick={() => handleActionClick('shop')}>
                      <ShoppingBag />
                      <span>Shop Menu</span>
                    </button>
                    <button className="action-btn" onClick={() => handleActionClick('popular')}>
                      <TrendingUp />
                      <span>Popular Items</span>
                    </button>
                    <button className="action-btn" onClick={() => handleActionClick('support')}>
                      <Headset />
                      <span>Support</span>
                    </button>
                  </div>
                )}
              </div>

              {msg.options && (
                <div className="actions-grid">
                  {msg.options.map(opt => (
                    <button 
                      key={opt.value}
                      className="action-btn" 
                      onClick={() => handleSend(opt.label, opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {msg.carousel && (
                <Carousel 
                  items={msg.carousel} 
                  onAddToCart={addToCart} 
                  onUpdateQty={updateQty} 
                  onRemove={removeFromCart} 
                  onItemClick={(item) => setSelectedItem(item)}
                  cart={cart} 
                />
              )}

              {msg.inventoryData && (
                <div className="admin-inventory-wrapper">
                  <table className="admin-inventory-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {msg.inventoryData.map((item, i) => (
                        <tr key={i} className={item.qty < 10 ? 'row-low' : ''}>
                          <td className="col-name">{item.name}</td>
                          <td className="col-cat">{item.category}</td>
                          <td className="col-stock">
                            <span className={`stock-badge ${item.qty < 10 ? 'low' : ''}`}>
                              {item.qty}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {msg.tracker && (
                <OrderTracker orderId={msg.tracker.orderId} currentStep={msg.tracker.currentStep} />
              )}

              {msg.showHistory && orderHistory.length > 0 && (
                <div className="recent-orders-list">
                  {orderHistory.map((order, idx) => (
                    <motion.div 
                      key={idx}
                      className="recent-order-card"
                      whileHover={{ x: 5 }}
                      onClick={() => {
                        const historicMsg = {
                          id: Date.now(),
                          type: 'bot',
                          text: `Re-viewing Order #${order.orderId}`,
                          isOrderSummary: true,
                          orderData: order
                        };
                        setMessages(prev => [...prev, historicMsg]);
                      }}
                    >
                      <div className="ro-icon"><ShoppingBag size={16} /></div>
                      <div className="ro-info">
                        <span className="ro-id">Order #{order.orderId}</span>
                        <span className="ro-date">{new Date(order.timestamp).toLocaleDateString()}</span>
                      </div>
                      <span className="ro-total">₹{order.subtotal}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {msg.recommendation && (
                <div className="recommendation-card">
                  <div className="rec-preview">
                    <Bot size={14} /> Similar choice
                  </div>
                  <div className="rec-content">
                    <span className="rec-name">{msg.recommendation.name}</span>
                    <span className="rec-price">₹{msg.recommendation.price}</span>
                  </div>
                  <button 
                    className="rec-add-btn" 
                    onClick={() => {
                      addToCart(msg.recommendation);
                      // Update current message to show "Added"
                      setMessages(prev => prev.map(m => 
                        m.id === msg.id ? { ...m, text: `Done! I've added **${msg.recommendation.name}** to your cart. 😋`, recommendation: null } : m
                      ));
                    }}
                  >
                    <Plus size={14} /> Quick Add
                  </button>
                </div>
              )}

              {msg.isOrderSummary && msg.orderData && (
                <OrderBill 
                  cart={msg.orderData.cart} 
                  orderId={msg.orderData.orderId} 
                  subtotal={msg.orderData.subtotal} 
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="message-wrapper bot"
          >
            <div className="bot-avatar">
              <Bot size={14} color="white" />
            </div>
            <div className="message bot" style={{ padding: '8px 16px' }}>
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ...
              </motion.span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
        <input 
          type="text" 
          className="chat-input" 
          placeholder="Ask about snacks..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="send-btn">
          <Send size={20} />
        </button>
      </form>

      <AnimatePresence>
        {showCart && (
          <CartPanel
            cart={cart}
            onUpdateQty={updateQty}
            onRemove={removeFromCart}
            onClose={() => setShowCart(false)}
            onPlaceOrder={handlePlaceOrder}
            onAddToCart={addToCart}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedItem && (
          <ProductDetail
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onAddToCart={(item) => { addToCart(item); setSelectedItem(null); }}
            onUpdateQty={updateQty}
            onRemove={removeFromCart}
            cartQty={cart.find(c => c.item.name === selectedItem.name)?.qty || 0}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chatbot;
