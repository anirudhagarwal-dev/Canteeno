import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import {
  fetchPopularItems,
  fetchSimilarItems,
  fetchMenu, 
} from "../config/recommendationApi";
import { sendChatMessage, checkChatApiStatus } from "../config/chatApi";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const url = "https://ajay-cafe-1.onrender.com"; 

  const [foodList, setFoodList] = useState([]); 
  const [menuList, setMenuList] = useState([]); 
  const [cartItems, setCartItems] = useState({});
  const [token, setToken] = useState("");
  const [userType, setUserType] = useState("user"); 

  useEffect(() => {
    const loadMenu = async () => {
      const result = await fetchMenu();
      if (result.success && result.data) {
        setMenuList(result.data);
        console.log("✅ Menu loaded from ML API:", result.data);
      } else {
        console.error("❌ Failed to load menu:", result.error);
      }
    };
    loadMenu();
  }, []);

  const fetchFoodList = async () => {
    try {
      const response = await axios.get(`${url}/api/foods/allFoods`);
      if (response.data.success) {
        setFoodList(response.data.data);
      } else {
        toast.error("Error fetching food list.");
      }
    } catch (error) {
      console.error("Error fetching food list:", error);
      toast.error("Network error while fetching food.");
    }
  };

  const loadCardData = async (token) => {
    try {
      const response = await axios.post(
        `${url}/api/cart/get`,
        {},
        { headers: { token } }
      );
      setCartItems(response.data.cartData || {});
    } catch (error) {
      console.error("Failed to load cart data", error);
      setCartItems({});
    }
  };

  useEffect(() => {
    async function loadData() {
      await fetchFoodList();

      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        setToken(storedToken);
        const savedUserType = localStorage.getItem("userType") || "user";
        setUserType(savedUserType);
        await loadCardData(storedToken);
      }
    }
    loadData();
  }, []);

  const getCartQuantity = (itemId) => {
    const item = cartItems[itemId];
    if (!item) return 0;
    if (typeof item === "number") return item;
    return item.quantity || 0;
  };

  const getCartNotes = (itemId) => {
    const item = cartItems[itemId];
    if (!item || typeof item === "number") return "";
    return item.notes || "";
  };

  const updateCartNotes = (itemId, notes) => {
    setCartItems((prev) => {
      const currentItem = prev[itemId];
      if (!currentItem) return prev;

      if (typeof currentItem === "number") {
        return { ...prev, [itemId]: { quantity: currentItem, notes } };
      }

      return { ...prev, [itemId]: { ...currentItem, notes } };
    });
  };

  const addToCart = async (itemId, notes = "") => {
    setCartItems((prev) => {
      const currentItem = prev[itemId];
      if (!currentItem)
        return { ...prev, [itemId]: { quantity: 1, notes: notes || "" } };

      if (typeof currentItem === "number")
        return {
          ...prev,
          [itemId]: { quantity: currentItem + 1, notes: notes || "" },
        };

      return {
        ...prev,
        [itemId]: {
          quantity: currentItem.quantity + 1,
          notes: notes || currentItem.notes || "",
        },
      };
    });

    if (token) {
      try {
        const response = await axios.post(
          `${url}/api/cart/add`,
          { itemId },
          { headers: { token } }
        );
        if (response.data.success) toast.success("Item added to cart");
        else toast.error(response.data.message || "Something went wrong");
      } catch {
        toast.error("Failed to update cart");
      }
    }
  };

  const removeFromCart = async (itemId) => {
    setCartItems((prev) => {
      const currentItem = prev[itemId];
      if (!currentItem) return prev;

      const newQty =
        typeof currentItem === "number"
          ? currentItem - 1
          : currentItem.quantity - 1;

      if (newQty <= 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [itemId]:
          typeof currentItem === "number"
            ? newQty
            : { ...currentItem, quantity: newQty },
      };
    });

    if (token) {
      try {
        const response = await axios.post(
          `${url}/api/cart/remove`,
          { itemId },
          { headers: { token } }
        );
        if (response.data.success) toast.success("Item removed from cart");
        else toast.error(response.data.message || "Something went wrong");
      } catch {
        toast.error("Failed to update cart");
      }
    }
  };

  const removeItemCompletely = async (itemId) => {
    if (!token) return toast.error("Please login first");
    try {
      const response = await axios.delete(`${url}/api/cart/remove/${itemId}`, {
        headers: { token },
      });

      if (response.data.success) {
        toast.success("Item removed completely");
        setCartItems((prev) => {
          const { [itemId]: _, ...rest } = prev;
          return rest;
        });
      } else {
        toast.error(response.data.message || "Failed to remove item");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Server error while removing item");
    }
  };

  const getTotalCartAmount = () => {
    return Object.keys(cartItems).reduce((total, itemId) => {
      const itemInfo = foodList.find((f) => f._id === itemId);
      if (itemInfo) total += itemInfo.price * getCartQuantity(itemId);
      return total;
    }, 0);
  };

  const getTotalCartItems = () => {
    return Object.keys(cartItems).reduce(
      (sum, itemId) => sum + getCartQuantity(itemId),
      0
    );
  };

  const contextValue = {
    url,
    food_list: menuList.length > 0 ? menuList : foodList, 
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    removeItemCompletely,
    getCartQuantity,
    getCartNotes,
    updateCartNotes,
    token,
    setToken,
    userType,
    setUserType,
    fetchPopularItems,
    fetchSimilarItems,
    sendChatMessage,
    checkChatApiStatus,
    getTotalCartAmount,
    getTotalCartItems,
    loadCardData,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
