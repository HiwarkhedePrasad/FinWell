// ==============================================
// FILE 1: utils/gmailParser.js
// DELETE ALL CONTENT and replace with this ONLY:

const { google } = require("googleapis");
const { OAuth2 } = google.auth;
const fs = require("fs");
const path = require("path");

const CREDENTIALS = require("../config/credentials");
const TOKEN_PATH = path.join(__dirname, "token.json");

const { client_id, client_secret, redirect_uris } = CREDENTIALS.web;

const oAuth2Client = new OAuth2(
  client_id,
  client_secret,
  "urn:ietf:wg:oauth:2.0:oob"
);

// Load tokens if they exist
if (fs.existsSync(TOKEN_PATH)) {
  const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
  oAuth2Client.setCredentials(tokenData);
} else {
  console.error(
    "Token not found. Run the OOB flow to generate token.json first."
  );
}

async function listExpenseEmails() {
  try {
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    // Get the email address of the authenticated user
    const profile = await gmail.users.getProfile({ userId: "me" });
    console.log("Checking emails for Gmail ID:", profile.data.emailAddress);

    // Try different search queries to find emails
    const searchQueries = [
      "subject:expense OR subject:receipt",
      "expense OR receipt OR payment",
      "transaction OR bill OR invoice",
      // Add date range to avoid processing very old emails repeatedly
      `after:${
        Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60
      } (expense OR receipt OR payment)`, // Last 30 days
    ];

    let allMessages = [];

    for (const query of searchQueries) {
      console.log(`Searching with query: "${query}"`);

      const res = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: 20, // Increased limit
      });

      if (res.data.messages && res.data.messages.length > 0) {
        console.log(
          `Found ${res.data.messages.length} messages with query: "${query}"`
        );
        allMessages = [...allMessages, ...res.data.messages];
        break; // Use the first successful query
      }
    }

    // Remove duplicates based on message id
    const uniqueMessages = allMessages.filter(
      (message, index, self) =>
        index === self.findIndex((m) => m.id === message.id)
    );

    console.log(`Total unique messages found: ${uniqueMessages.length}`);
    return uniqueMessages;
  } catch (err) {
    console.error("Error listing emails:", err);
    return [];
  }
}

async function parseEmail(messageId) {
  try {
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    const res = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    const payload = res.data.payload;
    const headers = {};

    // Extract headers
    if (payload.headers) {
      payload.headers.forEach((header) => {
        headers[header.name.toLowerCase()] = header.value;
      });
    }

    console.log(`Email from: ${headers.from}, Subject: ${headers.subject}`);

    let body = "";

    // Function to extract text from email parts
    function extractTextFromParts(parts) {
      let text = "";

      if (!parts) return text;

      for (const part of parts) {
        if (part.mimeType === "text/plain" && part.body && part.body.data) {
          text += Buffer.from(part.body.data, "base64").toString("utf-8");
        } else if (
          part.mimeType === "text/html" &&
          part.body &&
          part.body.data &&
          !text
        ) {
          // Use HTML as fallback if no plain text
          const htmlText = Buffer.from(part.body.data, "base64").toString(
            "utf-8"
          );
          // Basic HTML to text conversion
          text += htmlText
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        } else if (part.parts) {
          // Recursive call for nested parts
          text += extractTextFromParts(part.parts);
        }
      }

      return text;
    }

    if (payload.parts && payload.parts.length > 0) {
      // Multipart email
      body = extractTextFromParts(payload.parts);
    } else if (payload.body && payload.body.data) {
      // Simple email
      const rawBody = Buffer.from(payload.body.data, "base64").toString(
        "utf-8"
      );
      // If it's HTML, do basic conversion to text
      if (payload.mimeType === "text/html") {
        body = rawBody
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      } else {
        body = rawBody;
      }
    }

    console.log(`Email body length: ${body.length}`);
    console.log(`Email body preview: ${body.substring(0, 300)}...`);

    return {
      headers,
      body,
      messageId,
    };
  } catch (err) {
    console.error("Error parsing email:", err);
    return {
      headers: {},
      body: "",
      messageId,
    };
  }
}

function extractExpenseData(emailData) {
  const { body, headers } = emailData;

  console.log("Extracting expense data from email...");
  console.log("Subject:", headers.subject);

  // Enhanced patterns to match different email formats
  const amountPatterns = [
    /Amount[:\s]*₹?\s*([\d,]+\.?\d*)/i,
    /Total[:\s]*₹?\s*([\d,]+\.?\d*)/i,
    /Price[:\s]*₹?\s*([\d,]+\.?\d*)/i,
    /Cost[:\s]*₹?\s*([\d,]+\.?\d*)/i,
    /₹\s*([\d,]+\.?\d*)/g,
    /INR[:\s]*([\d,]+\.?\d*)/i,
    /Rs\.?\s*([\d,]+\.?\d*)/i,
    /\$\s*([\d,]+\.?\d*)/g,
    // More flexible patterns
    /paid[:\s]*₹?\s*([\d,]+\.?\d*)/i,
    /charged[:\s]*₹?\s*([\d,]+\.?\d*)/i,
    /bill[:\s]*₹?\s*([\d,]+\.?\d*)/i,
  ];

  const titlePatterns = [
    /Item[:\s]*(.+?)[\n\r]/i,
    /Product[:\s]*(.+?)[\n\r]/i,
    /Service[:\s]*(.+?)[\n\r]/i,
    /Purchase[:\s]*(.+?)[\n\r]/i,
    /Transaction[:\s]*(.+?)[\n\r]/i,
    /Description[:\s]*(.+?)[\n\r]/i,
    /For[:\s]*(.+?)[\n\r]/i,
    /Order[:\s]*(.+?)[\n\r]/i,
  ];

  const vendorPatterns = [
    /Vendor[:\s]*(.+?)[\n\r]/i,
    /Merchant[:\s]*(.+?)[\n\r]/i,
    /Store[:\s]*(.+?)[\n\r]/i,
    /From[:\s]*(.+?)[\n\r]/i,
    /Shop[:\s]*(.+?)[\n\r]/i,
    /Company[:\s]*(.+?)[\n\r]/i,
  ];

  const datePatterns = [
    /Date of Purchase[:\s]*([^\r\n]+)/i,
    /Transaction Date[:\s]*([^\r\n]+)/i,
    /Purchase Date[:\s]*([^\r\n]+)/i,
    /Date[:\s]*([^\r\n]+)/i,
    /On[:\s]*([^\r\n]+)/i,
    /Purchased on[:\s]*([^\r\n]+)/i,
  ];

  let amount = 0;
  let title = "";
  let vendor = "";
  let parsedDate = new Date();

  // Try to find amount
  for (const pattern of amountPatterns) {
    const match = body.match(pattern);
    if (match) {
      const rawAmount = match[1].replace(/,/g, "");
      amount = parseFloat(rawAmount);
      if (amount > 0) {
        // Only use positive amounts
        console.log(`Found amount: ${amount} with pattern: ${pattern}`);
        break;
      }
    }
  }

  // Try to find title
  for (const pattern of titlePatterns) {
    const match = body.match(pattern);
    if (match) {
      title = match[1].trim();
      // Clean up the title
      if (title.length > 100) title = title.substring(0, 100);
      if (title && title.length > 3) {
        // Only use meaningful titles
        console.log(`Found title: ${title} with pattern: ${pattern}`);
        break;
      }
    }
  }

  // Try to find vendor
  for (const pattern of vendorPatterns) {
    const match = body.match(pattern);
    if (match) {
      vendor = match[1].trim();
      if (vendor.length > 50) vendor = vendor.substring(0, 50);
      console.log(`Found vendor: ${vendor} with pattern: ${pattern}`);
      break;
    }
  }

  // Try to find date
  for (const pattern of datePatterns) {
    const match = body.match(pattern);
    if (match) {
      const dateString = match[1].trim();
      const tempDate = new Date(dateString);
      if (!isNaN(tempDate.getTime()) && tempDate.getFullYear() > 2020) {
        parsedDate = tempDate;
        console.log(`Found date: ${parsedDate} with pattern: ${pattern}`);
        break;
      }
    }
  }

  // Fallback: use email subject as title if no title found
  if (!title && headers.subject) {
    title = headers.subject.trim();
    // Clean up common email prefixes
    title = title.replace(/^(Re:|Fwd:|FW:|RE:)\s*/i, "");
  }

  // Fallback: use sender as vendor if no vendor found
  if (!vendor && headers.from) {
    const emailMatch = headers.from.match(/<(.+)>/);
    if (emailMatch) {
      vendor = emailMatch[1];
    } else {
      vendor = headers.from;
    }
    // Extract domain as vendor name
    if (vendor.includes("@")) {
      const domain = vendor.split("@")[1];
      vendor = domain.split(".")[0];
    }
  }

  const result = {
    title: title || "Gmail Expense",
    amount: amount || 0,
    vendor: vendor || "",
    date: parsedDate,
  };

  console.log("Extracted expense data:", result);
  return result;
}

module.exports = {
  listExpenseEmails,
  parseEmail,
  extractExpenseData,
};

// ==============================================
// FILE 2: routes/gmailRoutes.js (or your route file)
// DELETE ALL CONTENT and replace with this ONLY:
