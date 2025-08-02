import admin from "firebase-admin";
import { Message } from "firebase-admin/messaging";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// 🔐 Load Firebase service account
const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");

const serviceAccount = JSON.parse(raw);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// ✅ POST handler
export async function POST(request: NextRequest) {
  console.log("📩 Received request to sendOrderNotification");

  try {
    const bodyText = await request.text(); // Use .text() instead of .json()
    const order = JSON.parse(bodyText);    // Manually parse

    const { fcm_token, product_id } = order;

    console.log("🛒 Incoming order:", order);

    if (!fcm_token || !product_id) {
      console.warn("⚠️ Missing fcm_token or product_id");
      return NextResponse.json(
        { success: false, message: "Missing token or product_id" },
        { status: 400 }
      );
    }

    // 📦 Fetch product from Supabase
    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", product_id)
      .single();

    if (error || !product) {
      console.warn("⚠️ Product not found", error);
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    console.log("📦 Fetched product:", product);

    // 📨 Prepare FCM payload
    const payload: Message = {
      token: fcm_token,
      notification: {
        title: "Purchase Successful!",
        body: `You bought ${product.name} for $${product.price}`,
        imageUrl: product.image_url || undefined,
      },
      webpush: {
        fcmOptions: {
          link: `/orders`,
        },
      },
    };

    // 🚀 Send push notification
    const response = await admin.messaging().send(payload);
    console.log("✅ FCM push sent:", response);

    return NextResponse.json({ success: true, message: "Notification sent!" });
  } catch (error) {
    console.error("❌ Error in sendOrderNotification:", error);
    return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 });
  }
}

// ✅ Optional GET for quick endpoint test
export async function GET() {
  return NextResponse.json({ success: true, message: "sendOrderNotification is live!" });
}
