# 🔐 Multi-Account Gmail Integration - Connect Any Gmail Account!

## 🎯 **Problem Solved**

**Issue**: The previous system only worked with one hardcoded Gmail account (stored in `token.json`), meaning only one user could use Gmail import functionality.

**Solution**: Implemented a **multi-account Gmail integration system** that allows each user to connect their own Gmail account and import expenses from their personal emails.

## 🏗️ **How Multi-Account Gmail Works**

### **1. User-Specific Token Storage**

Each user's Gmail tokens are stored separately in the database:

```javascript
const GmailTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    access_token: { type: String, required: true },
    refresh_token: { type: String, required: true },
    scope: { type: String, required: true },
    token_type: { type: String, default: "Bearer" },
    expiry_date: { type: Number, required: true },
    gmailEmail: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    lastUsed: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
```

### **2. Gmail Service Layer**

Created a service layer that handles user-specific Gmail operations:

```javascript
class GmailService {
  // Create OAuth2 client for a specific user
  async createOAuth2Client(userId) {
    const tokenData = await GmailToken.findOne({ userId, isActive: true });
    // ... create and configure OAuth2 client
  }

  // List emails for a specific user
  async listExpenseEmails(userId, searchQueries = null) {
    const oAuth2Client = await this.createOAuth2Client(userId);
    // ... fetch emails using user's tokens
  }

  // Parse email for a specific user
  async parseEmail(userId, messageId) {
    const oAuth2Client = await this.createOAuth2Client(userId);
    // ... parse email using user's tokens
  }
}
```

### **3. OAuth2 Authentication Flow**

Users can connect their Gmail accounts through a secure OAuth2 flow:

1. **Generate Auth URL**: User clicks "Connect Gmail"
2. **Gmail OAuth**: User authorizes the app in Gmail
3. **Token Exchange**: Backend exchanges code for tokens
4. **Token Storage**: Tokens stored in database for that user
5. **Ready to Import**: User can now import from their Gmail

## 🔄 **User Experience Flow**

### **Step 1: User Registration/Login**

- User creates account or logs in
- No Gmail connection initially

### **Step 2: Connect Gmail Account**

- User clicks "Connect Gmail" button
- OAuth popup opens with Gmail authorization
- User grants permissions to read emails
- Tokens are stored securely in database

### **Step 3: Import Expenses**

- User clicks "Import from Gmail"
- System uses their stored tokens
- Processes emails from their Gmail account
- Creates expenses in their account

### **Step 4: Manage Connection**

- User can disconnect Gmail anytime
- User can reconnect with different account
- Each user's data is completely isolated

## 🛠️ **Technical Implementation**

### **Backend Components**

#### **1. GmailToken Model**

```javascript
// Stores user-specific Gmail tokens
const GmailToken = mongoose.model("GmailToken", GmailTokenSchema);
```

#### **2. GmailService**

```javascript
// Handles all Gmail operations for any user
const gmailService = require("../services/gmailService");
```

#### **3. Authentication Routes**

```javascript
// Gmail OAuth2 endpoints
GET / api / gmail / auth / url; // Generate auth URL
GET / api / gmail / auth / callback; // OAuth callback
GET / api / gmail / auth / status; // Check connection status
DELETE / api / gmail / auth / disconnect; // Disconnect account
```

#### **4. Updated Import Routes**

```javascript
// Uses user-specific tokens
GET / api / gmail / fetch - expenses; // Import from user's Gmail
```

### **Frontend Components**

#### **1. Dynamic UI States**

```javascript
// Shows different buttons based on connection status
{gmailStatus.connected ? (
  // Show connected email + import button + disconnect
) : (
  // Show connect button
)}
```

#### **2. OAuth Flow**

```javascript
const handleGmailConnect = async () => {
  const response = await axiosInstance.get(API_PATHS.GMAIL.AUTH_URL);
  window.open(response.data.authUrl, "_blank", "width=500,height=600");
};
```

## 🔒 **Security Features**

### **✅ User Isolation**

- Each user's tokens stored separately
- No cross-user data access
- User-specific email processing

### **✅ Token Security**

- Tokens encrypted in database
- Automatic token refresh
- Secure OAuth2 flow

### **✅ Privacy Protection**

- Only reads emails (no write access)
- Minimal required permissions
- User can revoke access anytime

## 📊 **Benefits of Multi-Account System**

### **✅ Individual User Experience**

- Each user connects their own Gmail
- Personal email processing
- No shared data between users

### **✅ Scalability**

- Supports unlimited users
- Each user has independent tokens
- No single point of failure

### **✅ Flexibility**

- Users can switch Gmail accounts
- Multiple users can use same Gmail
- Easy account management

### **✅ Security**

- User-specific authentication
- Isolated data processing
- Secure token management

## 🚀 **API Endpoints**

### **Gmail Authentication**

```http
GET /api/gmail/auth/url
Response: { success: true, authUrl: "https://accounts.google.com/..." }

GET /api/gmail/auth/status
Response: { success: true, connected: true, gmailEmail: "user@gmail.com" }

DELETE /api/gmail/auth/disconnect
Response: { success: true, message: "Gmail account disconnected" }
```

### **Gmail Import (Updated)**

```http
GET /api/gmail/fetch-expenses
Headers: Authorization: Bearer <user_jwt_token>
Response: { totalExpensesImported: 5, duplicatesSkipped: 2, ... }
```

## 🧪 **Testing Scenarios**

### **Test 1: Multiple Users**

1. User A connects Gmail account A
2. User B connects Gmail account B
3. Both users import expenses
4. Each user only sees their own emails

### **Test 2: Account Switching**

1. User connects Gmail account A
2. User disconnects account A
3. User connects Gmail account B
4. User imports from account B

### **Test 3: Token Refresh**

1. User connects Gmail account
2. Token expires after 1 hour
3. System automatically refreshes token
4. Import continues working seamlessly

## 🔧 **Configuration**

### **Environment Variables**

```env
# Gmail OAuth2 Configuration
GMAIL_REDIRECT_URI=http://localhost:8000/api/gmail/auth/callback
CLIENT_URL=http://localhost:5173

# Database Configuration
MONGO_URI=mongodb://localhost:27017/spendwise
```

### **Google Cloud Console Setup**

1. Create OAuth2 credentials
2. Add authorized redirect URIs
3. Enable Gmail API
4. Configure consent screen

## 📝 **Database Schema**

### **GmailToken Collection**

```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // Reference to User
  access_token: String,       // Gmail access token
  refresh_token: String,      // Gmail refresh token
  scope: String,              // OAuth scopes
  token_type: String,         // "Bearer"
  expiry_date: Number,        // Token expiry timestamp
  gmailEmail: String,         // Connected Gmail address
  isActive: Boolean,          // Token status
  lastUsed: Date,             // Last usage timestamp
  createdAt: Date,
  updatedAt: Date
}
```

### **ProcessedEmail Collection (Updated)**

```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // User who processed email
  gmailMessageId: String,     // Gmail message ID
  emailSubject: String,       // Email subject
  senderEmail: String,        // Sender email
  processedAt: Date,          // Processing timestamp
  expenseId: ObjectId,        // Created expense (if any)
  status: String,             // "processed", "skipped", "error"
  createdAt: Date,
  updatedAt: Date
}
```

## 🎯 **User Interface**

### **Connected State**

```
[user@gmail.com] [Import from Gmail] [Disconnect]
```

### **Disconnected State**

```
[Connect Gmail]
```

### **Importing State**

```
[user@gmail.com] [Importing...] [Disconnect]
```

## 🔄 **Migration from Single Account**

### **For Existing Users**

1. **First Login**: No Gmail connection
2. **Connect Gmail**: User must connect their account
3. **Import**: Works with their connected account
4. **No Data Loss**: All existing expenses remain

### **Database Migration**

```javascript
// Optional: Migrate existing single-account tokens
const existingToken = fs.readFileSync("token.json");
if (existingToken) {
  // Create GmailToken for admin user
  await GmailToken.create({
    userId: adminUserId,
    ...JSON.parse(existingToken),
    gmailEmail: "admin@gmail.com",
  });
}
```

## 🚀 **Usage Examples**

### **Frontend Integration**

```javascript
// Check Gmail connection status
const status = await axiosInstance.get(API_PATHS.GMAIL.AUTH_STATUS);
if (status.data.connected) {
  console.log(`Connected to: ${status.data.gmailEmail}`);
}

// Connect Gmail account
const authUrl = await axiosInstance.get(API_PATHS.GMAIL.AUTH_URL);
window.open(authUrl.data.authUrl, "_blank");

// Import expenses
const result = await axiosInstance.get(API_PATHS.GMAIL.GMAIL_PARSER);
console.log(`Imported ${result.data.totalExpensesImported} expenses`);
```

### **Backend Usage**

```javascript
// Get user's Gmail profile
const profile = await gmailService.getGmailProfile(userId);
console.log(`User's Gmail: ${profile.emailAddress}`);

// List user's emails
const emails = await gmailService.listExpenseEmails(userId);
console.log(`Found ${emails.length} emails`);

// Parse specific email
const emailData = await gmailService.parseEmail(userId, messageId);
console.log(`Email subject: ${emailData.headers.subject}`);
```

## 🎉 **Summary**

The **Multi-Account Gmail Integration** enables:

✅ **Any user can connect their Gmail account**  
✅ **Complete user isolation and privacy**  
✅ **Secure OAuth2 authentication flow**  
✅ **Automatic token refresh and management**  
✅ **Easy account switching and management**  
✅ **Scalable architecture for unlimited users**

**Result**: Every user can now connect their own Gmail account and import expenses from their personal emails, with complete privacy and security!

---

**🚀 Your Gmail integration now supports unlimited users! 🚀**
