"use client";

import { Button } from "@/components/ui/button";
import useFcmToken from "@/hooks/useFcmToken";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price: string
}

interface Order {
  id: string;
  name: string;
  product_id: string;
  price: string;
  fcm_token: string;
  created_at: string;
}

export default function Home() {
  const { token, notificationPermissionStatus } = useFcmToken();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true); // <-- Add loading state

  const handleTestNotification = async () => {
    const response = await fetch("/send-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: token,
        title: "Test Notification",
        message: "This is a test notification",
        link: "/contact",
      }),
    });

    const data = await response.json();
    console.log(data);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true); // Start loading
      const { data, error } = await supabase.from("products").select("*");
      const products = (data as Product[]) || [];
      setProducts(products);
      setLoadingProducts(false); // End loading
      if (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  const handleBuyNow = async (price: string, name: string, product_id: string) => {
    if (!token) {
      toast.error("Notification token not available. Please enable notifications to buy products.");
      return;
    }
    // Handle the buy now action, e.g., redirect to a checkout page or show a modal
    toast.info(`You just bought ${name} for $${price}`);
    const { data, error } = await supabase.from("orders").insert({ name, product_id, price, fcm_token: token }).select();
    if (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to create order");
    }
  }

  


  return (
    <main className="p-10">
      <h1 className="text-4xl mb-4 font-bold">Firebase Cloud Messaging Demo</h1>

      {notificationPermissionStatus === "granted" ? (
        <p>Permission to receive notifications has been granted.</p>
      ) : notificationPermissionStatus !== null ? (
        <p>
          You have not granted permission to receive notifications. Please
          enable notifications in your browser settings.
        </p>
      ) : null}

      <Button
        disabled={!token}
        className="mt-5"
        onClick={handleTestNotification}
      >
        Send Test Notification
      </Button>
      <div className="mt-5">
        <h2 className="text-2xl mb-2">Products:</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {loadingProducts
            ? Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="border p-4 rounded-lg shadow animate-pulse"
                >
                  <div className="w-full h-48 bg-gray-200 mb-2 rounded" />
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-8 bg-gray-200 rounded w-1/2 mt-2" />
                </div>
              ))
            : products.map((product: Product) => (
                <div
                  key={product.id}
                  className="border p-4 rounded-lg shadow hover:shadow-lg transition-shadow"
                >
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-48 object-cover mb-2 rounded"
                  />
                  <h3 className="text-xl font-semibold">{product.name}</h3>
                  <p className="text-gray-600">{product.description}</p>
                  <p className="text-lg font-bold mt-2">${product.price}</p>
                  <button
                    onClick={() =>
                      handleBuyNow(product?.price, product?.name, product.id)
                    }
                    className="bg-gray-900 text-white px-4 py-2 mt-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    Buy Now
                  </button>
                </div>
              ))}
        </div>
      </div>
    </main>
  );
}
