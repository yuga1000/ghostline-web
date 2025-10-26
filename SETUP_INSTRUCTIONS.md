# Ghostline Order Page - Setup Instructions

## 📧 EmailJS Setup

### Step 1: Get your IDs from EmailJS dashboard

1. Go to https://dashboard.emailjs.com
2. Login with your account (`ghostlinesystem@gmail.com`)

### Step 2: Create Email Service

1. Click **"Email Services"** in left sidebar
2. Click **"Add New Service"**
3. Choose **Gmail**
4. Connect `ghostlinesystem@gmail.com`
5. Copy the **Service ID** (looks like `service_abc123`)

### Step 3: Create Email Template

1. Click **"Email Templates"** in left sidebar
2. Click **"Create New Template"**
3. Paste this template:

```
Subject: New Ghostline Order #{{order_id}}

Hi Yuga,

New order received:

━━━━━━━━━━━━━━━━━━━━━
ORDER DETAILS
━━━━━━━━━━━━━━━━━━━━━

Order ID: {{order_id}}
Date: {{timestamp}}

Size: {{size}}
Custom dimensions: {{custom_width}} x {{custom_height}} cm
Vibe preferences: {{vibes}}
Format: {{format}}

Total Price: {{total_price}} ETH

━━━━━━━━━━━━━━━━━━━━━
CUSTOMER INFO
━━━━━━━━━━━━━━━━━━━━━

Email: {{customer_email}}

━━━━━━━━━━━━━━━━━━━━━
PAYMENT
━━━━━━━━━━━━━━━━━━━━━

Transaction Hash: {{tx_hash}}

Verify on Etherscan:
https://etherscan.io/tx/{{tx_hash}}

━━━━━━━━━━━━━━━━━━━━━

Check this transaction and confirm payment!

- Ghostline System
```

4. Template settings:
   - **To Email**: `ghostlinesystem@gmail.com`
   - **From Name**: `Ghostline Order Bot`
   - **Reply To**: `{{customer_email}}`

5. Save and copy the **Template ID** (looks like `template_xyz789`)

### Step 4: Get Public Key

1. Click **"Account"** → **"General"**
2. Copy your **Public Key** (looks like `user_abcXYZ123`)

### Step 5: Update order.html

Open `order.html` and replace:

```javascript
// Line 18:
emailjs.init("YOUR_PUBLIC_KEY");  // ← Replace with your Public Key

// Line 696-697:
'YOUR_SERVICE_ID',    // ← Replace with Service ID
'YOUR_TEMPLATE_ID',   // ← Replace with Template ID
```

---

## 📊 Google Sheets Setup

### Step 1: Create Spreadsheet

1. Go to https://sheets.google.com
2. Click **"Blank spreadsheet"**
3. Name it: `Ghostline Orders`
4. Create headers in Row 1:

| Order ID | Timestamp | Size | Custom W | Custom H | Vibes | Format | Total ETH | Customer Email | TX Hash | Status |
|----------|-----------|------|----------|----------|-------|--------|-----------|----------------|---------|--------|

### Step 2: Create Google Apps Script

1. In your spreadsheet, click **Extensions** → **Apps Script**
2. Delete default code
3. Paste this script:

```javascript
function doPost(e) {
  try {
    // Get the active spreadsheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Parse incoming data
    var data = JSON.parse(e.postData.contents);

    // Append row with order data
    sheet.appendRow([
      data.orderId,
      data.timestamp,
      data.size,
      data.customWidth,
      data.customHeight,
      data.vibes,
      data.format,
      data.totalPrice,
      data.email,
      data.txHash,
      data.status
    ]);

    // Return success
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'success',
      'orderId': data.orderId
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'error',
      'error': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Click **Save** (disk icon)
5. Click **Deploy** → **New deployment**
6. Choose **Web app**
7. Settings:
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
8. Click **Deploy**
9. Copy the **Web app URL** (looks like `https://script.google.com/macros/s/ABC123.../exec`)

### Step 3: Update order.html

Open `order.html` and replace:

```javascript
// Line 707:
await fetch('YOUR_GOOGLE_APPS_SCRIPT_URL', {  // ← Paste your Web app URL here
```

---

## ✅ Testing

1. Open `order.html` in browser
2. Fill out the form (use fake data for testing)
3. Submit order
4. Check:
   - ✓ Email arrives at `ghostlinesystem@gmail.com`
   - ✓ New row appears in Google Sheets
   - ✓ Success message shows on website

---

## 🚀 Deploy to Railway

Once everything works locally:

1. Upload `order.html` to `/Users/yuga/Desktop/ghostline-web/`
2. Push to git:
   ```bash
   cd /Users/yuga/Desktop/ghostline-web
   git add order.html
   git commit -m "Add order page with EmailJS + Google Sheets"
   git push origin main
   ```
3. Railway will auto-deploy
4. Access at: `https://ghostline.live/order.html`

---

## 🔐 Security Notes

- ⚠️ **EmailJS Public Key is safe** to expose (it's client-side only)
- ⚠️ **Google Apps Script URL is safe** to expose (it only accepts POST requests)
- ✅ **Never expose** private keys or service secrets
- ✅ **Wallet address** is public (safe to show)

---

## 📝 What Happens When Order Submitted:

1. **User fills form** → clicks "PLACE ORDER"
2. **JavaScript sends**:
   - Email to you via EmailJS
   - Data to Google Sheets via Apps Script
3. **User sees** success message with Order ID
4. **You receive**:
   - Email notification with all details
   - New row in Google Sheets for tracking
5. **You verify** payment on Etherscan
6. **You generate** artwork and ship to customer

---

## 🛠 Troubleshooting

**Email not arriving?**
- Check EmailJS dashboard → Email History
- Check spam folder
- Verify Service ID and Template ID

**Google Sheets not updating?**
- Check Apps Script logs (View → Logs)
- Verify deployment settings (Execute as: Me, Access: Anyone)
- Check browser console for errors

**Form not submitting?**
- Open browser console (F12)
- Look for JavaScript errors
- Check network tab for failed requests
