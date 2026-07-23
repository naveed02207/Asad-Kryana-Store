# Google Sheets Apps Script Setup

We've moved to a simple serverless architecture using Google Apps Script! No backend servers, no service accounts, and no complex configuration needed. Your React frontend will communicate directly with your Google Sheet via a single Web App URL.

## Follow these 3 Simple Steps:

### Step 1: Open Google Apps Script
1. Open your Google Sheet.
2. From the top menu, click **Extensions** > **Apps Script**.
3. A new editor window will open. Delete any code there (`function myFunction() {...}`) and paste the ENTIRE script provided below.

### Step 2: Set up Initial Tabs (Optional but recommended)
You can let the script auto-create the tabs when needed, or you can manually create these tabs right now:
- `Inventory` (headers: id, name, price, stock, category, unit)
- `Customers` (headers: id, name, phone, address, balance)
- `KhataTransactions` (headers: id, customerId, amount, type, date, description)
- `Billing` (headers: id, customerId, customerName, total, discount, paymentMethod, items, date)
- `Settings` (headers: key, value)
  *(In the Settings tab, under key put `admin_pin` and under value put `1234`. Also put `bank_name` to `UBL`, `account_title` to `Asad Karyana`, and `account_number` to `1234567890123`)*

### Step 3: Deploy as Web App
1. In the Apps Script editor, click **Deploy** (top right blue button) > **New deployment**.
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**.
3. Fill in the settings:
   - Description: (Optional, e.g., "Karyana Store API")
   - Execute as: **Me** (your Google account)
   - Who has access: **Anyone**
4. Click **Deploy**.
5. *Important:* Google will prompt you to authorize access. Click **Authorize access**, choose your Google account, click **Advanced** at the bottom, and click **Go to Untitled project (unsafe)**. Allow the permissions.
6. Once deployed, copy the **Web app URL**.

### Step 4: Configure Applet
In the AI Studio settings, set the following environment variable:
`VITE_APPS_SCRIPT_URL` = <Paste your Web app URL here>

---

## Google Apps Script Code (Code.gs)

Copy and paste this into your Apps Script editor:

```javascript
function doGet(e) {
  return handleRequest(e, "GET");
}

function doPost(e) {
  return handleRequest(e, "POST");
}

function doOptions(e) {
  return handleCORS();
}

function handleCORS() {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders(headers);
}

function handleRequest(e, method) {
  try {
    const action = e.parameter.action;
    
    // For POST we might send JSON body
    let payload = null;
    if (method === "POST" && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
    
    let result = { error: "Invalid action" };
    
    if (action === "getProducts") {
      result = getProducts();
    } else if (action === "addProduct") {
      result = addProduct(payload);
    } else if (action === "updateProduct") {
      result = updateProduct(e.parameter.id, payload);
    } else if (action === "deleteProduct") {
      result = deleteProduct(e.parameter.id);
    } else if (action === "getCustomers") {
      result = getCustomers();
    } else if (action === "addCustomer") {
      result = addCustomer(payload);
    } else if (action === "getKhata") {
      result = getKhata(e.parameter.customerId);
    } else if (action === "addKhataTransaction") {
      result = addKhataTransaction(payload);
    } else if (action === "checkout") {
      result = checkout(payload);
    } else if (action === "getReports") {
      result = getReports(e.parameter.start, e.parameter.end);
    } else if (action === "getSettings") {
      result = getSettings();
    } else if (action === "verifyPin") {
      result = verifyPin(payload.pin);
    }
    
    // Google Apps Script requires this pattern for CORS responses from doGet/doPost
    const output = ContentService.createTextOutput(JSON.stringify(result));
    output.setMimeType(ContentService.MimeType.JSON);
    
    return output;
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Helpers to work with Sheets
function getSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    row._rowIndex = i + 1; // store row index for updates
    rows.push(row);
  }
  return rows;
}

function ensureSheet(sheetName, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
  }
  return sheet;
}

function getSettings() {
  const data = getSheetData("Settings");
  const settings = {};
  data.forEach(r => {
    if (r.key !== "admin_pin") {
      settings[r.key] = r.value;
    }
  });
  return settings;
}

function verifyPin(pin) {
  const data = getSheetData("Settings");
  const pinRow = data.find(r => r.key === "admin_pin");
  if (pinRow && String(pinRow.value) === String(pin)) {
    return { success: true, token: "admin_token_123" };
  }
  return { success: false, error: "Invalid PIN" };
}

function getProducts() {
  return getSheetData("Inventory").map(r => ({
    id: r.id,
    name: r.name,
    price: Number(r.price),
    stock: Number(r.stock),
    category: r.category,
    unit: r.unit
  }));
}

function addProduct(product) {
  const sheet = ensureSheet("Inventory", ["id", "name", "price", "stock", "category", "unit"]);
  const newProduct = { ...product, id: new Date().getTime().toString() };
  sheet.appendRow([newProduct.id, newProduct.name, newProduct.price, newProduct.stock, newProduct.category, newProduct.unit]);
  return newProduct;
}

function updateProduct(id, updates) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventory");
  if (!sheet) return { error: "No inventory sheet" };
  const data = getSheetData("Inventory");
  const row = data.find(r => String(r.id) === String(id));
  if (row) {
    const headers = sheet.getDataRange().getValues()[0];
    const newValues = [];
    // We update fields
    const updated = { ...row, ...updates };
    for (let j = 0; j < headers.length; j++) {
      newValues.push(updated[headers[j]] !== undefined ? updated[headers[j]] : '');
    }
    sheet.getRange(row._rowIndex, 1, 1, headers.length).setValues([newValues]);
    return { id, ...updates };
  }
  return { error: "Product not found" };
}

function deleteProduct(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventory");
  const data = getSheetData("Inventory");
  const row = data.find(r => String(r.id) === String(id));
  if (row) {
    sheet.deleteRow(row._rowIndex);
    return { success: true };
  }
  return { error: "Product not found" };
}

function getCustomers() {
  return getSheetData("Customers").map(r => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    address: r.address,
    balance: Number(r.balance || 0)
  }));
}

function addCustomer(customer) {
  const sheet = ensureSheet("Customers", ["id", "name", "phone", "address", "balance"]);
  const newCustomer = { ...customer, id: new Date().getTime().toString(), balance: 0 };
  sheet.appendRow([newCustomer.id, newCustomer.name, newCustomer.phone, newCustomer.address, newCustomer.balance]);
  return newCustomer;
}

function getKhata(customerId) {
  return getSheetData("KhataTransactions")
    .filter(r => String(r.customerId) === String(customerId))
    .map(r => ({
      id: r.id,
      customerId: r.customerId,
      amount: Number(r.amount),
      type: r.type,
      date: r.date,
      description: r.description
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function addKhataTransaction(payload) {
  const { customerId, amount, type, description, date } = payload;
  const custSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Customers");
  const custData = getSheetData("Customers");
  const custRow = custData.find(r => String(r.id) === String(customerId));
  if (!custRow) return { error: "Customer not found" };
  
  let currentBalance = Number(custRow.balance || 0);
  let numAmount = Number(amount);
  if (type === "payment") currentBalance -= numAmount;
  else if (type === "credit") currentBalance += numAmount;
  
  const headers = custSheet.getDataRange().getValues()[0];
  const updatedCust = { ...custRow, balance: currentBalance };
  const newCustValues = [];
  for (let j = 0; j < headers.length; j++) {
    newCustValues.push(updatedCust[headers[j]] !== undefined ? updatedCust[headers[j]] : '');
  }
  custSheet.getRange(custRow._rowIndex, 1, 1, headers.length).setValues([newCustValues]);
  
  const transSheet = ensureSheet("KhataTransactions", ["id", "customerId", "amount", "type", "date", "description"]);
  const newTransaction = {
    id: new Date().getTime().toString(),
    customerId,
    amount: numAmount,
    type,
    date: date || new Date().toISOString(),
    description
  };
  transSheet.appendRow([newTransaction.id, newTransaction.customerId, newTransaction.amount, newTransaction.type, newTransaction.date, newTransaction.description]);
  return { transaction: newTransaction, newBalance: currentBalance };
}

function checkout(payload) {
  const { items, total, customerId, customerName, paymentMethod, discount, amountPaid } = payload;
  
  // Update stock
  const invSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventory");
  const invData = getSheetData("Inventory");
  const invHeaders = invSheet.getDataRange().getValues()[0];
  
  for (let i=0; i<items.length; i++) {
    const item = items[i];
    const row = invData.find(r => String(r.id) === String(item.productId));
    if (row) {
      let currentStock = Number(row.stock || 0);
      let newStock = Math.max(0, currentStock - item.quantity);
      let updatedRow = { ...row, stock: newStock };
      let newVals = [];
      for (let j = 0; j < invHeaders.length; j++) {
        newVals.push(updatedRow[invHeaders[j]] !== undefined ? updatedRow[invHeaders[j]] : '');
      }
      invSheet.getRange(row._rowIndex, 1, 1, invHeaders.length).setValues([newVals]);
    }
  }
  
  const dateStr = new Date().toISOString();
  
  // Khata
  if (paymentMethod === "khata" && customerId) {
    const custSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Customers");
    const custData = getSheetData("Customers");
    const custRow = custData.find(r => String(r.id) === String(customerId));
    if (custRow) {
      let currentBalance = Number(custRow.balance || 0);
      const advancePaid = Number(amountPaid || 0);
      const amountAddedToKhata = total - advancePaid;
      
      currentBalance += amountAddedToKhata;
      const headers = custSheet.getDataRange().getValues()[0];
      const updatedCust = { ...custRow, balance: currentBalance };
      const newCustValues = [];
      for (let j = 0; j < headers.length; j++) {
        newCustValues.push(updatedCust[headers[j]] !== undefined ? updatedCust[headers[j]] : '');
      }
      custSheet.getRange(custRow._rowIndex, 1, 1, headers.length).setValues([newCustValues]);
      
      const transSheet = ensureSheet("KhataTransactions", ["id", "customerId", "amount", "type", "date", "description"]);
      transSheet.appendRow([
        new Date().getTime().toString(),
        customerId,
        amountAddedToKhata,
        "credit",
        dateStr,
        `Bill Purchase ${advancePaid > 0 ? '(Partial Payment)' : ''}`
      ]);
    }
  }
  
  // Billing
  const billSheet = ensureSheet("Billing", ["id", "customerId", "customerName", "total", "discount", "paymentMethod", "items", "date"]);
  const newBill = {
    id: new Date().getTime().toString(),
    customerId: customerId || "",
    customerName: customerName || "Walk-in",
    total,
    discount: discount || 0,
    paymentMethod,
    items: JSON.stringify(items),
    date: dateStr
  };
  billSheet.appendRow([newBill.id, newBill.customerId, newBill.customerName, newBill.total, newBill.discount, newBill.paymentMethod, newBill.items, newBill.date]);
  
  return { success: true, bill: newBill };
}

function getReports(start, end) {
  const data = getSheetData("Billing").map(r => ({
    id: r.id,
    customerId: r.customerId,
    customerName: r.customerName,
    total: Number(r.total),
    discount: Number(r.discount),
    paymentMethod: r.paymentMethod,
    items: JSON.parse(r.items || "[]"),
    date: r.date
  }));
  
  if (start && end) {
    const startDate = new Date(start).getTime();
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);
    const endDateTime = endDate.getTime();
    
    return data.filter(o => {
      const t = new Date(o.date).getTime();
      return t >= startDate && t <= endDateTime;
    });
  }
  return data;
}
```
