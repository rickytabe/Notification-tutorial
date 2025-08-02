"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Order {
  id: string;
  product_id: string;
  price: string;
  fcm_token: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products for product name lookup
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) {
        toast.error("Failed to fetch products");
        return;
      }
      setProducts(data as Product[]);
    };
    fetchProducts();
  }, []);

   const fetchOrders = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) {
        toast.error("Failed to fetch orders");
        setLoading(false);
        return;
      }
      setOrders(data as Order[]);
      setLoading(false);
    };

  // Fetch orders every 2 seconds
  useEffect(() => {
    fetchOrders();
  }, []);

  const getProductName = (product_id: string) => {
    const product = products.find((p) => p.id === product_id);
    return product ? product.name : "Unknown Product";
  };

  return (
    <main className="p-10">
      <h1 className="text-4xl mb-6 font-bold">Orders</h1>
      <button className="text-4xl mb-6 font-bold" onClick={() => fetchOrders()}>refresh orders</button>
      {loading ? (
        <div>
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="border p-4 rounded-lg shadow animate-pulse mb-4">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : orders.length > 0 ? (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="border p-4 rounded-lg shadow">
              <p className="font-semibold">Order ID: <span className="font-mono">{order.id}</span></p>
              <p>
                Product: <span className="font-semibold">{getProductName(order.product_id)}</span>
                <span className="ml-2 text-gray-500 text-sm">({order.product_id})</span>
              </p>
              <p>Price: <span className="font-bold">${order.price}</span></p>
              <p className="text-gray-600 text-sm">Created At: {new Date(order.created_at).toLocaleString()}</p>
              <p className="text-xs text-gray-400 break-all">FCM Token: {order.fcm_token}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No orders found.</p>
      )}
    </main>
  );
}