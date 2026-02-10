import React, { useContext, useEffect, useState } from "react";
import "./MyOrders.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { assets } from "../../assets/frontend_assets/assets";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config";

const MyOrders = () => {
  const { token } = useContext(StoreContext);
  const [data, setData] = useState([]);
  const [orderCount, setOrderCount] = useState(0);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/order/userorder`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      if (response.data.success) {
        setData(response.data.data);
        setOrderCount(response.data.data.length);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const progressInCycle = orderCount % 6;
  const ordersUntilFree = progressInCycle === 0 ? 6 : 6 - progressInCycle;

  const deleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    try {
      const res = await axios.delete(
        `${API_BASE_URL}/order/deleteOrder/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data.success) {
        alert("Order deleted successfully!");
        fetchOrders();
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete order");
    }
  };

  return (
    <div className="my-orders">
      <h2>Orders</h2>

      <div className="loyalty-program">
        <h3>🎉 Foodie Rewards</h3>
        <p style={{ color: "#475569", marginBottom: "15px" }}>
          Complete 6 orders to earn a FREE complementary item!
        </p>

        {progressInCycle === 0 && orderCount > 0 ? (
          <div className="reward-message">
            <p>
              🎁 <strong>Congratulations!</strong> You've earned a free item!
            </p>
            <p>Your next order will include a complimentary item.</p>
          </div>
        ) : (
          <div className="reward-progress">
            <p>
              Progress: {progressInCycle}/6 —{" "}
              <strong>{ordersUntilFree} more order(s) until free item!</strong>
            </p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(progressInCycle / 6) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="order-container">
        {data.length === 0 && <p>No orders found.</p>}

        {data.map((order) => (
          <div key={order._id} className="order-card">
            <div className="order-header">
              <img
                src={assets.parcel_icon}
                className="parcel-icon"
                alt="parcel"
              />
              <span>Order Id : {order._id}</span>
            </div>

            <div className="order-items">
              {order.items.map((item, i) => (
                <div key={i} className="order-item-row">
                  <img
                    src={item.food.image}
                    className="order-food-img"
                    alt="food"
                  />

                  <div className="item-info">
                    <p className="item-name">{item.food.name}</p>
                    <p className="item-qty">Qty: {item.quantity}</p>
                  </div>

                  <div className="item-price">
                    <p>
                      {item.quantity} × {item.food.price}
                    </p>
                    <p className="item-total">
                      ₹{item.quantity * item.food.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-summary">
              <p>
                <strong>Total: </strong>₹{order.totalAmount}
              </p>
              <p>
                <strong>Status: </strong>
                <span className={`status ${order.status}`}>{order.status}</span>
              </p>
            </div>

            <div className="btn">
              <button
                className="track-btn"
                onClick={() => navigate(`/track/${order._id}`)}
              >
                Track Order
              </button>
              <button
                className="delete-btn"
                onClick={() => deleteOrder(order._id)}
              >
                Cancel Order
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;
