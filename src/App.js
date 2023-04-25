import React from "react";
import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Navbar, Products, Cart, Checkout } from "./components";
import  commerce  from "./lib/commerce";

const App = () => {

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [order, setOrder] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  
  const fetchProducts = async () => {
    commerce.products.list().then((products) => {
      setProducts(products.data);
    }).catch((error) => {
      console.log('There was an error fetching the products', error)
    });
  };
  const fetchCart = async () => {
    setCart(await commerce.cart.retrieve());
  };
  const handleAddToCart = async (productId, quantity) => {
    const {cart} = await commerce.cart.add(productId, quantity);
    setCart(cart);
  };
  const handleUpdateCartQty = async (productId, quantity) => {
    const {cart} = await commerce.cart.update(productId, {quantity});
    setCart(cart);
  };
  const handleRemoveFromCart = async (productId) => {
    const {cart} = await commerce.cart.remove(productId);
    setCart(cart);
  };
  const handleEmptyCart = async () => {
    const {cart} = await commerce.cart.empty();
    setCart(cart);
  };

  const refreshCart = async () => {
    const newCart = await commerce.cart.refresh();
    setCart(newCart);
  }

  const handleCaptureCheckout = async (checkoutTokenId, newOrder) => {
    try {
      const incomingOrder = await commerce.checkout.capture(checkoutTokenId, newOrder);

      setOrder(incomingOrder);
      refreshCart();

    } catch (error) {
      console.log(error);
      setErrorMessage(error.data.error.message);
    }
  }

  useEffect(() => {
    fetchProducts();
    fetchCart();
  },[]);
  console.log(cart);
  return (
    <div>
      <Navbar totalItems={cart.total_items} />
      <Routes>
        <Route path="/"
          element={ <Products products={products} onAddToCart={handleAddToCart} />}
        />
        <Route path="/cart"
          element={<Cart
              cart={cart}
              handleUpdateCartQty={handleUpdateCartQty}
              handleRemoveFromCart={handleRemoveFromCart}
              handleEmptyCart={handleEmptyCart}
            />}
        />
        <Route path="/checkout"
          element={ <Checkout 
            cart={cart}
            order={order}
            onCaptureCheckout={handleCaptureCheckout}
            error={errorMessage}
            />}
        />
      </Routes>
    </div>
  );
};

export default App;
