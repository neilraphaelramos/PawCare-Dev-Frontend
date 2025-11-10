import React, { useState, useEffect, useContext } from 'react';
import './PetProducts.css';
import { FaWallet, FaMoneyBillAlt } from 'react-icons/fa';
import axios from 'axios';
import { UserContext } from '../../hook/authContext'
import { useLocation } from 'react-router-dom';

const UserInventory = () => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [cart, setCart] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState({
    houseStreet: '',
    barangay: '',
    municipality: '',
    province: '',
    landmark: '',
  });
  const [items, setItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const { user } = useContext(UserContext);
  const location = useLocation();
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageModal, setMessageModal] = useState('')
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [orders, setOrders] = useState([]);

  const [qrImageUrl, setQrImageUrl] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const userId = user?.id;

  const fullName = `${user.firstName} ${user.lastName}`;

  const handleMessageModal = () => {
    setPaymentSuccess(false);
    setShowMessageModal(false);
    setMessageModal('');
  }

  const handleConfirmOrder = async () => {
    if (cart.length === 0) {
      setShowMessageModal(true);
      setMessageModal("Your order is empty. Please add items.");
      return;
    }

    // ✅ If Cash on Delivery, skip PayMongo and upload order directly
    if (paymentMethod === "cod") {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/orders/create_cod_order`, {
          uid: user.id,
          customer_name: fullName,
          customer_address: `${deliveryInfo.houseStreet}, ${deliveryInfo.barangay}, ${deliveryInfo.municipality}, ${deliveryInfo.province}`,
          total: totalAmount,
          methodPayments: "cod",
          landmark: deliveryInfo.landmark,
          cart,
        });

        setShowModal(false);
        setShowMessageModal(true);
        setMessageModal("✅ Order placed successfully with Cash on Delivery!");
        setCart([]);
      } catch (err) {
        console.error("❌ Error placing COD order:", err);
        setShowMessageModal(true);
        setMessageModal("Server error while placing order. Please try again.");
      }
      return; // 🚫 stop further PayMongo logic
    }

    // 💳 Otherwise continue with QRPH / PayMongo flow below
    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/orders/create_payment_intent`,
        {
          amount: totalAmount,
          name: fullName,
          email: user.email,
          phone: user.phone,
        }
      );

      if (!data.success) {
        setShowMessageModal(true);
        setMessageModal("Failed to create payment. Please try again.");
        return;
      }

      // Show QR modal
      setQrImageUrl(data.qrImageBase64);
      setPaymentIntentId(data.payment_intent_id);
      setShowQrModal(true);
      setShowModal(false);

      // Flag to prevent multiple DB inserts
      let orderSubmitted = false;

      const checkPayment = async () => {
        try {
          const statusRes = await axios.get(
            `${process.env.REACT_APP_API_URL}/orders/check_payment_status/${data.payment_intent_id}`
          );

          const status = statusRes.data.status;
          console.log(`🔍 Payment Status: ${status}`);

          if (status === "succeeded" && !orderSubmitted) {
            console.log("✅ Payment successful! Saving order...");
            orderSubmitted = true;

            await axios.post(`${process.env.REACT_APP_API_URL}/orders`, {
              uid: user.id,
              customer_name: fullName,
              customer_address: `${deliveryInfo.houseStreet}, ${deliveryInfo.barangay}, ${deliveryInfo.municipality}, ${deliveryInfo.province}`,
              total: totalAmount,
              methodPayments: "qrph",
              landmark: deliveryInfo.landmark,
              cart,
            });

            setShowQrModal(false);
            setShowMessageModal(true);
            setMessageModal("✅ Payment successful! Your order has been placed.");
            setCart([]);

            try {
              await axios.post(`${process.env.REACT_APP_API_URL}/notifications/api`, {
                UID: user.id,
                title_notify: 'Order Placed Successfully',
                type_notify: 'order',
                details: `Your order totaling ₱${totalAmount} has been placed successfully.`,
              });
            } catch (notifyErr) {
              console.error("Notification error:", notifyErr);
            }
          } else if (
            status === "awaiting_payment_method" ||
            status === "awaiting_next_action"
          ) {
            setTimeout(checkPayment, 5000);
          } else if (status === "cancelled") {
            setShowQrModal(false);
          } else {
            setTimeout(checkPayment, 5000);
          }
        } catch (err) {
          console.error("Error checking payment status:", err);
          setTimeout(checkPayment, 7000);
        }
      };

      checkPayment();
    } catch (err) {
      console.error("Error creating payment intent:", err);
      setShowMessageModal(true);
      setMessageModal("Server error while creating payment intent.");
    }
  };

  const handleCancelPayment = async () => {
    setIsConfirming(true);
    if (!paymentIntentId) {
      console.warn("⚠️ No payment intent to cancel.");
      setShowQrModal(false);
      return;
    }

    try {
      console.log("🟡 Cancelling payment intent:", paymentIntentId);

      const res = await axios.post(`${process.env.REACT_APP_API_URL}/orders/cancel_payment_intent`, {
        payment_intent_id: paymentIntentId,
      });

      if (res.data.success) {
        console.log("🛑 Payment intent canceled successfully.");
        setMessageModal("Payment canceled successfully.");
      } else {
        console.warn("⚠️ Payment cancel request failed:", res.data.message);
        setMessageModal("Failed to cancel payment. Please try again.");
      }
    } catch (err) {
      console.error("❌ Error canceling payment intent:", err);
      setMessageModal("Server error while canceling payment.");
    } finally {
      setShowQrModal(false);
      setQrImageUrl("");
      setPaymentIntentId("");
      setShowMessageModal(true);
      setIsConfirming(false);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      // 1️⃣ Check PayMongo payment status
      const statusRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/orders/check_payment_status/${paymentIntentId}`
      );

      if (statusRes.data.status === "succeeded") {
        console.log("✅ Payment succeeded! Confirming order in backend...");

        // 2️⃣ Confirm order (this route verifies with PayMongo and saves to DB)
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/orders/confirm_order`, {
          payment_intent_id: paymentIntentId,
          amount: totalAmount,
          name: fullName,
          address: `${deliveryInfo.houseStreet}, ${deliveryInfo.barangay}, ${deliveryInfo.municipality}, ${deliveryInfo.province}`,
          date: new Date().toISOString().slice(0, 10),
          items: cart.map(item => ({
            product_ID: item.id,
            name: item.name,
            qty: item.qty,
          })),
          uid: user.id,
        });

        if (res.data.success) {
          console.log("✅ Order confirmed and saved!");
          setShowQrModal(false);
          setCart([]);
          setMessageModal("✅ Payment verified and order confirmed!");
        } else {
          console.warn("⚠️ Backend did not confirm payment:", res.data.message);
          setMessageModal(res.data.message || "Payment not yet confirmed. Please wait or try again.");
        }
      } else if (statusRes.data.status === "cancelled") {
        setMessageModal("❌ Payment was cancelled.");
      } else {
        console.log("⏳ Payment still pending:", statusRes.data.status);
        setMessageModal("Payment not yet confirmed. Please wait or try again.");
      }

      setShowMessageModal(true);
    } catch (err) {
      console.error("❌ Error confirming payment:", err);
      setMessageModal("Server error confirming payment. Please try again later.");
      setShowMessageModal(true);
    }
  };

  const handleCancelRequest = async (orderId) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/orders/request_cancel`, {
        id_order: orderId,
        uid: user.id,
      });

      if (res.data.success) {
        setMessageModal("✅ Cancel request submitted. Waiting for admin approval.");
        fetchInventory();
      } else {
        setMessageModal(res.data.message || "Failed to request cancel.");
      }
    } catch (err) {
      console.error("Error requesting cancel:", err);
      setMessageModal("Server error requesting cancellation.");
    } finally {
      setShowMessageModal(true);
    }
  };

  const mapRowToUIItem = (row) => ({
    id: row.product_ID,
    name: row.name,
    type: row.item_group,
    quantity: row.stock,
    unit: row.unit,
    price: parseFloat(row.price),
    image: row.photo,
  });

  const fetchInventory = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/inventory/fetch`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        const mapped = res.data.data.map(mapRowToUIItem);
        setItems(mapped);
        console.table(mapped);
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // 🛒 Cart functions
  const addToCart = (item) => {
    if (item.quantity === 0) {
      setShowMessageModal(true);
      setMessageModal(`❌ "${item.name}" is out of stock.`);
      return;
    }

    const exists = cart.find(cartItem => cartItem.id === item.id);

    if (exists) {
      // prevent adding more than available
      if (exists.qty + 1 > item.quantity) {
        setShowMessageModal(true);
        setMessageModal(`Only ${item.quantity} units of "${item.name}" are available.`);
        return;
      }

      setCart(cart.map(cartItem =>
        cartItem.id === item.id ? { ...cartItem, qty: cartItem.qty + 1 } : cartItem
      ));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };


  const handleViewOrders = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/orders/${userId}`);
      setOrders(res.data.orders || []);
      setShowOrdersModal(true);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  useEffect(() => {
    if (user) {
      setDeliveryInfo({
        houseStreet: user.houseNum || '',
        barangay: user.barangay || '',
        municipality: user.municipality || '',
        province: user.province || '',
        landmark: user.landmark || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment');

    if (paymentStatus === 'success') {
      setPaymentSuccess(true);
      setMessageModal('✅ Payment successful! Your order has been confirmed.');

      setCart([]);
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));
  const increaseQty = (id) => {
    const itemInCart = cart.find(i => i.id === id);
    const inventoryItem = items.find(i => i.id === id);

    if (!itemInCart || !inventoryItem) return;

    if (itemInCart.qty < inventoryItem.quantity) {
      setCart(cart.map(item =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      setShowMessageModal(true);
      setMessageModal(`Only ${inventoryItem.quantity} units of "${inventoryItem.name}" are available.`);
    }
  };
  const decreaseQty = (id) => setCart(cart.map(item => item.id === id && item.qty > 1 ? { ...item, qty: item.qty - 1 } : item));
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2);

  // 🔍 Filter by search and type
  const filteredInventory = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'All' || item.type === filterType;
    return matchSearch && matchType;
  });

  const itemTypes = [...new Set(items.map(item => item.type))];

  return (
    <div className="inventory-wrapper">
      {/* Left: Inventory */}
      <div className="inventory-left">
        <div className="inventory-filters">
          <input
            type="text"
            placeholder="Search Products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="inventory-search"
          />
          <div className="inventory-types">
            <button
              className={filterType === 'All' ? 'active' : ''}
              onClick={() => setFilterType('All')}
            >
              All
            </button>
            {itemTypes.map((type, i) => (
              <button
                key={i}
                className={filterType === type ? 'active' : ''}
                onClick={() => setFilterType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="inventory-grid scrollable-area">
          {filteredInventory.map(item => (
            <div
              key={item.id}
              className={`inventory-card ${item.quantity === 0 ? 'out-of-stock' : ''}`}
            >
              <div className="product-image-wrapper">
                <img src={item.image} alt={item.name} className="product-image" />

                {item.quantity === 0 && (
                  <div className="outofstock-overlay">
                    <img
                      src="/images/outofstockimg.png"
                      alt="Out of Stock"
                      className="outofstock-image"
                    />
                  </div>
                )}
              </div>

              <h3>{item.name}</h3>
              <p>₱{item.price.toFixed(2)}</p>

              <button
                onClick={() => item.quantity > 0 && addToCart(item)}
                disabled={item.quantity === 0}
              >
                {item.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="inventory-cart scrollable-area">
        <h2>My Order</h2>
        {cart.length === 0 ? (
          <p className="empty-cart">Your cart is empty.</p>
        ) : (
          <ul>
            {cart.map(item => (
              <li key={item.id}>
                <div className="cart-item">
                  <img src={item.image} alt={item.name} />
                  <div className="cart-item-details">
                    <h4>{item.name}</h4>
                    <p>₱{(item.qty * item.price).toFixed(2)}</p>
                  </div>
                  <div className="cart-actions">
                    <div className="qty-control">
                      <button onClick={() => decreaseQty(item.id)}>-</button>
                      <span>{item.qty}</span>
                      <button onClick={() => increaseQty(item.id)}>+</button>
                    </div>
                    <button className="remove-btn" onClick={() => removeFromCart(item.id)}>✕</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="cart-summary">
          <p>Total: <strong>₱{totalAmount}</strong></p>
          <button
            className="checkout-btn"
            onClick={() => {
              if (cart.length === 0) {
                setMessageModal('Your cart is empty. Please add items before checking out.');
                setShowMessageModal(true);
                return;
              }
              setShowModal(true);
            }}
          >
            Checkout
          </button>
          {/* 🆕 View Orders Button */}
          <button
            className="checkout-btn"
            onClick={handleViewOrders}
          >
            View My Orders
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Checkout</h2>
            <div className="modal-content">

              {/* Left: Cart Summary */}
              <div className="modal-left">
                <table className="modal-cart-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.id}>
                        <td className="product-info">
                          <img src={item.image} alt={item.name} />
                          <div>
                            <p><strong>{item.name}</strong></p>
                            <p className="product-type">Type: {item.type}</p>
                          </div>
                        </td>
                        <td>
                          <div className="qty-control">
                            <button onClick={() => decreaseQty(item.id)}>-</button>
                            <span>{item.qty}</span>
                            <button onClick={() => increaseQty(item.id)}>+</button>
                          </div>
                        </td>
                        <td>₱{(item.qty * item.price).toFixed(2)}</td>
                        <td>
                          <button className="remove-btn" onClick={() => removeFromCart(item.id)}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="modal-total">Total: ₱{totalAmount}</div>
              </div>

              {/* Right: Delivery + Payment */}
              <div className="modal-right">
                <div className="modal-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>House No. / Street</label>
                      <input
                        type="text"
                        value={deliveryInfo.houseStreet}
                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, houseStreet: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Barangay</label>
                      <input
                        type="text"
                        value={deliveryInfo.barangay}
                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, barangay: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Municipality</label>
                      <input
                        type="text"
                        value={deliveryInfo.municipality}
                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, municipality: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Province</label>
                      <input
                        type="text"
                        value={deliveryInfo.province}
                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, province: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ width: '100%' }}>
                      <label>Landmark</label>
                      <input
                        type="text"
                        value={deliveryInfo.landmark}
                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, landmark: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* 🆕 Payment Method */}
                <div className="modal-payment">
                  <h4>Payment Method</h4>
                  <div className="payment-options">
                    <label>
                      <input
                        type="radio"
                        name="payment"
                        value="qrph"
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <FaWallet /> QR Ph Payment
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <FaMoneyBillAlt /> Cash on Delivery
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button onClick={() => setShowModal(false)}>Back</button>
                  <button
                    className="checkout-confirm"
                    onClick={handleConfirmOrder}
                    disabled={!paymentMethod}
                  >
                    Confirm Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOrdersModal && (
        <div className="vo-modal-overlay">
          <div className="vo-modal">
            {/* HEADER */}
            <div className="vo-modal-header">
              <h2>My Orders</h2>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="vo-modal-body">
              {orders.length === 0 ? (
                <p className="vo-no-orders">You have no orders yet.</p>
              ) : (
                <div className="vo-modal-orders-list">
                  {orders.map(order => (
                    <div key={order.id_order} className="vo-modal-order-card">
                      <div className="vo-modal-order-header">
                        <h4>Order #{order.id_order}</h4>
                        <span className={`vo-modal-order-status ${order.order_status.toLowerCase()}`}>
                          {order.order_status}
                        </span>
                      </div>

                      <p><strong>Date:</strong> {new Date(order.order_date).toLocaleString()}</p>
                      <p><strong>Address:</strong> {order.customer_address}</p>

                      <table className="vo-modal-items-table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.product_name}</td>
                              <td>{item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="vo-modal-order-footer">
                        Total: ₱{order.total.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="vo-modal-footer">
              <button onClick={() => setShowOrdersModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {paymentSuccess && (
        <div className="messpay-modal-overlay">
          <div className="messpay-modal">
            <div className="messpay-icon-circle">
              <svg
                className="messpay-check-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2>Payment Successful!</h2>
            <p>{messageModal}</p>
            <button
              className="messpay-close-btn"
              onClick={handleMessageModal}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showMessageModal && (
        <div className="messOrd-modal-overlay">
          <div className="messOrd-modal">
            <div className="messOrd-modal-header">
              <h2>Alert Message</h2>
            </div>
            <div className="messOrd-modal-body">
              <p>{messageModal || "Your order message goes here."}</p>
            </div>
            <div className="messOrd-modal-footer">
              <button
                className="messOrd-close-btn"
                onClick={handleMessageModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showQrModal && (
        <div className="messOrd-modal-overlay">
          <div className="messOrd-modal">
            <div className="messOrd-modal-header align-center-adjust">
              <h2>Scan to Pay (QR Ph)</h2>
            </div>

            <div className="messOrd-modal-body-qrph">
              <img
                src={qrImageUrl}
                alt="QR Payment"
                className='messOrd-qr-image'
              />
            </div>

            <div className="messOrd-modal-footer">
              <button className='messOrd-close-btn' onClick={handleCancelPayment}>Cancel</button>
              <button
                className='messOrd-confirm-btn'
                onClick={handleConfirmPayment}
                disabled={isConfirming}
              >
                {isConfirming ? 'Checking...' : 'I’ve Paid'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserInventory;
