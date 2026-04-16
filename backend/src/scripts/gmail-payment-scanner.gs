/**
 * Google Apps Script — Gmail Payment Scanner
 * 
 * Alternative to the Node.js IMAP scanner. Runs entirely in Google's infrastructure.
 * No server needed, no IMAP credentials, no App Passwords.
 * 
 * ═══ SETUP ═══
 * 
 * 1. Go to https://script.google.com → New Project
 * 2. Paste this entire file into the editor
 * 3. Update CONFIG below with your values
 * 4. Run → Run function → "setup" (grants permissions)
 * 5. Done! The script will check Gmail every 1 minute automatically.
 * 
 * ═══ HOW IT WORKS ═══
 * 
 * - Every minute, searches Gmail for unread bank notification emails
 * - Extracts VIP transfer codes (format: VIPxxxxxxxx) from email body
 * - Calls your backend webhook: POST /hooks/gmail-payment
 * - Marks processed emails as read
 * 
 * ═══ LOGS ═══
 * 
 * View → Execution log (in Apps Script editor)
 */

// ─── Configuration ──────────────────────────────────────────────
const CONFIG = {
  // Your backend webhook URL
  WEBHOOK_URL: "https://phimtruyenhay.com/hooks/gmail-payment",
  
  // Must match GMAIL_WEBHOOK_SECRET in your backend .env
  WEBHOOK_SECRET: "YOUR_STRONG_SECRET_HERE",
  
  // Gmail search query to find bank emails
  // Real sender addresses confirmed from actual bank emails:
  //   BIDV:       from:ebankinfo@bidv.com.vn
  //   VCB:        from:VCBDigibank@info.vietcombank.com.vn  ← real sender!
  //   MBBank:     from:mbbank@mbbank.com.vn
  //   Techcombank: from:transaction@techcombank.com.vn
  //   ACB:        from:ebanking@acb.com.vn
  //   VPBank:     from:notify@vpbank.com.vn
  //   TPBank:     from:notify@tpb.vn
  // VCB subject: "Biên lai chuyển tiền qua tài khoản"
  // BIDV subject: "Biến động số dư tài khoản"
  GMAIL_SEARCH: 'is:unread (from:ebankinfo@bidv.com.vn OR from:VCBDigibank@info.vietcombank.com.vn OR from:mbbank@mbbank.com.vn OR from:transaction@techcombank.com.vn OR from:ebanking@acb.com.vn OR subject:"Bien lai chuyen tien" OR subject:"Biên lai chuyển tiền" OR subject:"bien dong so du" OR subject:"biến động số dư" OR subject:"thông báo giao dịch" OR subject:"thong bao giao dich")',
  
  // Maximum emails to process per run (to stay within Apps Script quotas)
  MAX_EMAILS_PER_RUN: 10,
};

// ─── Main scan function (triggered every minute) ─────────────────
function scanForPayments() {
  try {
    const threads = GmailApp.search(CONFIG.GMAIL_SEARCH, 0, CONFIG.MAX_EMAILS_PER_RUN);
    
    if (threads.length === 0) return;
    
    Logger.log(`Found ${threads.length} thread(s) to check`);
    
    for (const thread of threads) {
      const messages = thread.getMessages();
      
      for (const message of messages) {
        if (!message.isUnread()) continue;
        
        const body = message.getPlainBody() || message.getBody();
        const subject = message.getSubject();
        const from = message.getFrom();
        
        Logger.log(`Checking email: "${subject}" from ${from}`);
        
        // Extract VIP transfer code
        const transferInfo = extractTransferInfo(body);
        
        if (transferInfo) {
          Logger.log(`Found transfer code: ${transferInfo.transferContent}, amount: ${transferInfo.amount}`);
          
          // Call webhook — only mark as read if webhook succeeds
          const result = callWebhook(transferInfo);
          Logger.log(`Webhook response: ${JSON.stringify(result)}`);
          
          if (result.status && result.status >= 200 && result.status < 300) {
            message.markRead();
          } else {
            Logger.log(`⚠️ Webhook failed (status ${result.status || "error"}), keeping email UNREAD for retry next scan`);
          }
        } else {
          // No VIP code found in this bank email — mark as read so we don't re-check it
          message.markRead();
        }
      }
    }
    
  } catch (error) {
    Logger.log(`Error: ${error.message}`);
  }
}

// ─── Extract transfer info from email body ──────────────────────
function extractTransferInfo(emailBody) {
  if (!emailBody) return null;
  
  // Strip HTML tags
  const text = emailBody
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  // Find VIP transfer code: VIP + 8 hex chars
  const codeMatch = text.match(/\b(VIP[0-9A-Fa-f]{8})\b/);
  if (!codeMatch) return null;
  
  const transferContent = codeMatch[1].toUpperCase();
  
  // Try to extract amount — covers major Vietnamese bank email formats:
  // VCB:   "Amount 22,000 VND"  (Số tiền / Amount on separate lines, tab-separated)
  // BIDV:  "+37,001 VND", "Số tiền ghi có: 37.001"
  // MB:    "Số tiền: 37.001đ", "GD: +37,001 VND"
  // TCB:   "PS ghi Có: +37,001 VND"
  // ACB:   "Amount: 37,001 VND"
  // TPBank: "Số tiền nhận: 37,001 VND"
  let amount = null;
  const amountPatterns = [
    // VCB format: "Amount 22,000 VND" (after tab→space normalization)
    /(?:Amount|Số tiền|So tien)[:\s]+([\d.,]+)\s*(?:VND|VNĐ|đ|dong)/i,
    // Generic: any number directly before VND/đ
    /\+?\s*([\d.,]+)\s*(?:VND|VNĐ|đ|dong)/i,
    /(?:GD|Giao dịch|Credit Amount)[:\s]+([\d.,]+)/i,
    /(?:PS|Phát sinh|Phat sinh)[:\s]+\+?([\d.,]+)/i,
    /(?:Số tiền ghi có|So tien ghi co|Ghi có|Ghi co|Credit)[:\s]+\+?([\d.,]+)/i,
    /(?:Số tiền nhận|So tien nhan|Tiền nhận|Tien nhan)[:\s]+\+?([\d.,]+)/i,
    /(?:PS ghi Có|PS ghi Co)[:\s]+\+?([\d.,]+)/i,
  ];
  
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      amount = parseInt(match[1].replace(/[.,\s]/g, ""), 10);
      if (amount > 0) break;
    }
  }
  
  return { transferContent, amount };
}

// ─── Call webhook ───────────────────────────────────────────────
function callWebhook(transferInfo) {
  const payload = {
    transferContent: transferInfo.transferContent,
    transferAmount: transferInfo.amount,
    source: "google-apps-script",
    scannedAt: new Date().toISOString(),
  };
  
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    headers: {
      "Authorization": `Bearer ${CONFIG.WEBHOOK_SECRET}`,
      "X-Scanner-Source": "google-apps-script",
    },
    muteHttpExceptions: true,
  };
  
  // Retry up to 3 times with exponential backoff
  var maxRetries = 3;
  for (var attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      var response = UrlFetchApp.fetch(CONFIG.WEBHOOK_URL, options);
      return {
        status: response.getResponseCode(),
        body: response.getContentText(),
      };
    } catch (error) {
      Logger.log(`Webhook attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      if (attempt < maxRetries) {
        // Wait 2s, 4s before retrying
        Utilities.sleep(2000 * attempt);
      } else {
        return { status: 0, error: error.message };
      }
    }
  }
}

// ─── Setup: create time-based trigger (run once) ────────────────
function setup() {
  // Remove any existing triggers for this function
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === "scanForPayments") {
      ScriptApp.deleteTrigger(trigger);
    }
  }
  
  // Create new trigger: every 1 minute
  ScriptApp.newTrigger("scanForPayments")
    .timeBased()
    .everyMinutes(1)
    .create();
  
  Logger.log("✅ Trigger created! scanForPayments will run every 1 minute.");
  Logger.log(`   Webhook URL: ${CONFIG.WEBHOOK_URL}`);
  Logger.log("   Run scanForPayments manually to test.");
}

// ─── Remove trigger ────────────────────────────────────────────
function removeTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === "scanForPayments") {
      ScriptApp.deleteTrigger(trigger);
      Logger.log("Trigger removed.");
    }
  }
}

// ─── Manual test ───────────────────────────────────────────────
function testWebhook() {
  const result = callWebhook({
    transferContent: "VIP00000000",
    amount: 37001,
  });
  Logger.log(`Test webhook result: ${JSON.stringify(result)}`);
}

// ─── Fake email scan test ──────────────────────────────────────
// Simulates finding 1 bank notification email with a VIP code.
// This runs the FULL pipeline: extract → webhook call.
// 
// HOW TO USE:
//   1. Replace FAKE_VIP_CODE with a real transfer code from your 
//      PaymentTransaction table (status = PENDING)
//   2. Set FAKE_AMOUNT matching the payment plan amount
//   3. Run → testFakeEmailScan
//
// VIP Plans & Amounts:
//   MONTH_1 = 37,001 VND
//   MONTH_3 = 97,001 VND
//   MONTH_6 = 177,001 VND
//   MONTH_12 = 337,001 VND
function testFakeEmailScan() {
  // ⬇️ CHANGE THESE to match a real pending PaymentTransaction
  const FAKE_VIP_CODE = "VIP00000000";  // e.g. "VIPA1B2C3D4"
  const FAKE_AMOUNT = 37001;            // e.g. 37001 for MONTH_1

  // Simulate a real Vietcombank payment receipt email (matches actual VCB email format)
  const fakeEmailBody = `
    Vietcombank

    Biên lai chuyển tiền qua tài khoản
    (Payment Receipt)

    Ngày, giờ giao dịch
    Trans. Date, Time	08:02 Thursday 16/04/2026
    Số lệnh giao dịch
    Order Number	13813556257
    Tài khoản nguồn
    Debit Account	9342429911
    Tên người chuyển tiền
    Remitter's name	HA DINH LOI
    Tài khoản người hưởng
    Credit Account	2206502400
    Tên người hưởng
    Beneficiary Name	HA DINH LOI
    Tên ngân hàng hưởng
    Beneficiary Bank Name	Bank for Investment and Development of Vietnam
    Số tiền
    Amount	${FAKE_AMOUNT.toLocaleString("vi-VN")} VND
    Loại phí
    Charge Code	Người chuyển trả
    Số tiền phí
    Charge Amount	0 VND
    Net income	0 VND
    VAT	0 VND
    Nội dung chuyển tiền
    Details of Payment	${FAKE_VIP_CODE} THANH TOAN VIP PHIMTRUYENHAY
  `;

  Logger.log("═══ FAKE EMAIL SCAN TEST ═══");
  Logger.log(`Simulating 1 bank email with code: ${FAKE_VIP_CODE}, amount: ${FAKE_AMOUNT}`);

  // Step 1: Extract transfer info (tests the regex parser)
  const transferInfo = extractTransferInfo(fakeEmailBody);

  if (!transferInfo) {
    Logger.log("❌ extractTransferInfo returned null — regex did not match!");
    Logger.log("   Check the fake email body format.");
    return;
  }

  Logger.log(`✅ Extracted: code=${transferInfo.transferContent}, amount=${transferInfo.amount}`);

  // Step 2: Call the real webhook (tests the full backend flow)
  const result = callWebhook(transferInfo);
  Logger.log(`📡 Webhook response: ${JSON.stringify(result)}`);

  if (result.status === 200) {
    Logger.log("🎉 SUCCESS! Payment was matched and processed.");
  } else if (result.status === 404) {
    Logger.log("⚠️ No matching pending transaction found. Make sure:");
    Logger.log(`   - A PaymentTransaction with transferContent="${FAKE_VIP_CODE}" exists`);
    Logger.log("   - Its status is PENDING, DETECTED, or VERIFYING");
  } else {
    Logger.log(`⚠️ Unexpected response code: ${result.status}`);
  }
}
