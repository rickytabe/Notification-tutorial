import admin from "firebase-admin";
import { Message } from "firebase-admin/messaging";
import { NextRequest, NextResponse } from "next/server";

// 🔐 Load service account JSON
const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");

const serviceAccount = JSON.parse(raw);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// 🔐 Supabase keys to fetch product info
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ✅ POST handler
export async function POST(request: NextRequest) {
  console.log("📩 Received request to sendOrderNotification");

  try {
    const order = await request.json();
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
    const productRes = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${product_id}`, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    const data = await productRes.json();
    const product = data[0];
    console.log("📦 Fetched product:", product);

    if (!product) {
      console.warn("⚠️ Product not found");
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

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
          link: `/orders/${product_id}`, // Adjust as needed
        },
      },
    };

    // 🚀 Send push notification
    const response = await admin.messaging().send(payload);
    console.log("✅ FCM push sent:", response);

    return NextResponse.json({ success: true, message: "Notification sent!" });
  } catch (error) {
    console.error("❌ Error in sendOrderNotification:", error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

// ✅ Optional GET for quick endpoint test
export async function GET() {
  return NextResponse.json({ success: true, message: "sendOrderNotification is live!" });
}
