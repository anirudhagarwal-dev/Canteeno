import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import "./TrackOrder.css";
import { API_BASE_URL } from "../../config";
import { io } from "socket.io-client";

import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const socket = io(API_BASE_URL);

const TrackOrder = () => {
  const { orderId } = useParams();
  const { token } = useContext(StoreContext);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [riderLocation, setRiderLocation] = useState({
    lat: 28.6139,
    lng: 77.209,
  });

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "GOOGLE_MAPS_KEY",
  });

  const fetchOrder = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/order/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) setOrder(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // LIVE STATUS UPDATE
    socket.on(`order-${orderId}-status`, (data) => {
      setOrder((prev) => ({ ...prev, status: data.status }));
    });

    // LIVE LOCATION UPDATE
    socket.on(`order-${orderId}-location`, (loc) => {
      setRiderLocation(loc);
    });

    return () => {
      socket.off(`order-${orderId}-status`);
      socket.off(`order-${orderId}-location`);
    };
  }, [orderId]);

  if (loading) return <p className="track-loading">Loading order...</p>;
  if (!order) return <p className="track-error">Order not found.</p>;

  const stages = ["pending", "preparing", "ready", "delivered"];
  const currentStage = stages.indexOf(order.status);

  return (
    <div className="track-order">
      <h2>Track Your Order</h2>

      <div className="order-info">
        <p>
          <strong>Order ID:</strong> {order._id}
        </p>
        <p>
          <strong>Total Amount:</strong> ₹{order.totalAmount}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <span className="status-blink">{order.status}</span>
        </p>
      </div>

      <div className="order-progress">
        {stages.map((stage, index) => (
          <div
            key={index}
            className={`progress-step ${index <= currentStage ? "active" : ""}`}
          >
            <div className="step-circle"></div>
            <p>{stage.toUpperCase()}</p>
          </div>
        ))}
      </div>

      <h3>Delivery Location</h3>
      {isLoaded && (
        <GoogleMap
          center={riderLocation}
          zoom={16}
          mapContainerStyle={{
            height: "300px",
            width: "100%",
            borderRadius: "12px",
          }}
        >
          <Marker position={riderLocation} />
        </GoogleMap>
      )}
      <div className="order-items">
        <h3>Your Items</h3>
        <ul>
          {order.items.map((item, idx) => (
            <li key={idx}>
              {item.food.name} × {item.quantity} ={" "}
              <strong>₹{item.quantity * item.price}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TrackOrder;
