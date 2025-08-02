import admin from "firebase-admin";
import { Message } from "firebase-admin/messaging";
import { NextRequest, NextResponse } from "next/server";

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");

const serviceAccount = JSON.parse(raw);
// Fix newlines
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Supabase Admin Key for fetching product info
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  const order = await request.json();
  const { fcm_token, product_id } = order;

  if (!fcm_token || !product_id) {
    return NextResponse.json(
      { success: false, message: "Missing token or product_id" },
      { status: 400 }
    );
  }

  try {
    // Fetch product details from Supabase
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${product_id}`, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    const [product] = await res.json();
    const title = "Purchase Successful!";
    const body = `You bought ${product?.name || "an item"} for $${product?.price || "??"}`;

    const payload: Message = {
      token: fcm_token,
      notification: {
        title,
        body,
        imageUrl: product?.image_url || undefined,
      },
      webpush: {
        fcmOptions: {
          link: "/contact", // Optional: Customize
        },
      },
    };

    await admin.messaging().send(payload);

    return NextResponse.json({ success: true, message: "Notification sent!" });
  } catch (error) {
    console.error("FCM error:", error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
