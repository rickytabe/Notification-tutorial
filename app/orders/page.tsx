"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Image from "next/image";

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
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
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


  return (
    <main className="p-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-4xl mb-6 font-bold">Orders</h1>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Refresh Orders
        </button>
      </div>
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="p-4 border rounded-lg  shadow animate-pulse">
              <div className="w-full h-48 bg-gray-200 mb-2 rounded" />
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-1/2 mt-2" />
            </div>
          )) : orders.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-10">
              No orders found.
            </div>
          ) : (
            orders.map((order) => {
              const product = products.find(p => p.id === order.product_id);
              return (
                <div className="p-4 border rounded-lg shadow" key={order.id}>
                  <img
                    src={product?.image_url ?? "/placeholder.png"}
                    alt={product?.name ?? "Product image"}
                    className="w-full h-48 object-cover mb-2 rounded"
                  />
                  <h2 className="text-xl font-semibold">{product?.name}</h2>
                  <p className="text-gray-600">Price: ${product?.price}</p>
                  <p className="text-gray-500">Created at: {new Date(order.created_at).toLocaleString()}</p>
                </div>
              );
            }))}
        </div>
      </div>
    </main>
  );
}