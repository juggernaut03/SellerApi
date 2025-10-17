# Pack Group Guide - Amazon FBA Integration

## Overview

The Pack Group feature enables you to create and manage Amazon FBA shipments in the same format as Amazon's pack group CSV files. This allows you to:

1. **Create shipments** with multiple products distributed across multiple boxes
2. **Track Amazon-specific data** (ASIN, FNSKU, condition, prep type)
3. **Export data** in Amazon FBA CSV format
4. **Manage box distribution** - redistribute products across boxes as needed

## Data Structure

### Shipment (Pack Group)
- `packGroup`: Pack group number (e.g., "1", "2")
- `fbaShipmentId`: Amazon FBA shipment ID
- `destination`: Warehouse destination
- `totalSKUs`: Total unique products
- `totalItems`: Total units across all boxes
- `totalBoxes`: Number of boxes

### Products (SKUs)
- `sku`: Your SKU
- `productName`: Product title
- `productId`: Internal product ID
- `asin`: Amazon Standard Identification Number
- `fnsku`: Fulfillment Network SKU
- `condition`: NewItem, UsedLikeNew, etc.
- `prepType`: NONE, Polybagging, Bubble wrap, etc.
- `expectedQty`: Total quantity expected
- `boxQuantities`: Array of quantities per box

### Boxes
- `boxNo`: Box number (BOX1, BOX2, etc.)
- `boxName`: Custom name (P1-B1, P1-B2, etc.)
- `boxWeight`: Weight in lbs
- `dimensions`: Length, width, height in inches
- `items`: Array of products in this box

## API Endpoints

### 1. Create Shipment from Pack Group

**Endpoint:** `POST /api/pack-groups`

**Request Body:**
```json
{
  "packGroup": "1",
  "fbaShipmentId": "FBA12345",
  "destination": "Amazon FBA TX Warehouse",
  "skus": [
    {
      "sku": "CP0069",
      "productName": "Chanaksha Trading Stainless Steel Idli Stand",
      "productId": "pkebcdea3b",
      "asin": "B07J2L93SN",
      "fnsku": "B07J2L93SN",
      "condition": "NewItem",
      "prepType": "NONE",
      "expectedQty": 32,
      "boxQuantities": [4, 4, 4, 4, 4, 4, 4, 4]
    },
    {
      "sku": "CP0092",
      "productName": "Chanaksha Trading Idli Pot Steamer",
      "productId": "pk458d7441",
      "asin": "B07K4B1PCV",
      "fnsku": "B07K4B1PCV",
      "condition": "NewItem",
      "prepType": "NONE",
      "expectedQty": 160,
      "boxQuantities": [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8]
    }
  ],
  "boxes": [
    {
      "boxNo": "BOX1",
      "boxName": "P1-B1",
      "boxWeight": 40,
      "length": 23,
      "width": 17,
      "height": 13
    },
    {
      "boxNo": "BOX2",
      "boxName": "P1-B2",
      "boxWeight": 40,
      "length": 23,
      "width": 17,
      "height": 13
    }
    // ... more boxes
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Shipment created from pack group successfully",
  "data": {
    "shipment": {
      "_id": "68f21a7ca4adffb439bfc68b",
      "shipmentId": "SHP2025-0001",
      "packGroup": "1",
      "fbaShipmentId": "FBA12345",
      "destination": "Amazon FBA TX Warehouse",
      "totalSKUs": 2,
      "totalItems": 192,
      "totalBoxes": 20,
      "boxes": [ /* ... */ ]
    }
  }
}
```

**Key Points:**
- All SKUs must exist in inventory
- `boxQuantities` array length must match `boxes` array length
- System auto-fills ASIN/FNSKU from inventory if not provided
- Shipment starts in `draft` status

### 2. Get Pack Group Data

**Endpoint:** `GET /api/pack-groups/:id`

Retrieves pack group data in a format ready for CSV export.

**Response:**
```json
{
  "success": true,
  "data": {
    "packGroup": "1",
    "fbaShipmentId": "FBA12345",
    "destination": "Amazon FBA TX Warehouse",
    "totalSKUs": 10,
    "totalItems": 636,
    "totalBoxes": 20,
    "skus": [
      {
        "sku": "CP0069",
        "productName": "Chanaksha Trading Stainless Steel Idli Stand",
        "productId": "pkebcdea3b",
        "asin": "B07J2L93SN",
        "fnsku": "B07J2L93SN",
        "condition": "NewItem",
        "prepType": "NONE",
        "expectedQty": 32,
        "boxedQty": 32,
        "boxQuantities": [4, 4, 4, 4, 4, 4, 4, 4, 0, 0, ...]
      }
      // ... more SKUs
    ],
    "boxes": [
      {
        "boxNo": "BOX1",
        "boxName": "P1-B1",
        "boxWeight": 40,
        "length": 23,
        "width": 17,
        "height": 13
      }
      // ... more boxes
    ]
  }
}
```

**Use Case:** Use this data to generate a CSV file matching Amazon's pack group format.

### 3. Update Box Distribution

**Endpoint:** `PUT /api/pack-groups/:id/distribution`

Redistribute products across boxes without changing total quantities.

**Request Body:**
```json
{
  "distributionData": [
    {
      "sku": "CP0069",
      "boxQuantities": [5, 5, 5, 5, 4, 4, 4, 0]
    },
    {
      "sku": "CP0092",
      "boxQuantities": [10, 10, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Box distribution updated successfully",
  "data": {
    "shipment": { /* updated shipment */ }
  }
}
```

**Key Points:**
- Only works on `draft` shipments
- Cannot add new SKUs (use shipment API for that)
- Set quantity to 0 to remove SKU from a box
- Total quantity per SKU is recalculated automatically

## Workflow Example

### Scenario: Create Amazon FBA Shipment

1. **Prepare Inventory**
   - Ensure all products exist in inventory with ASIN/FNSKU

2. **Design Box Distribution**
   - Decide how many boxes you need
   - Distribute products across boxes based on:
     - Weight limits (typically 50 lbs per box)
     - Dimension limits
     - Product fragility

3. **Create Pack Group Shipment**
   ```bash
   POST /api/pack-groups
   {
     "packGroup": "1",
     "destination": "Amazon FBA Warehouse",
     "skus": [ /* with boxQuantities */ ],
     "boxes": [ /* with dimensions */ ]
   }
   ```

4. **Review and Adjust**
   - Get pack group data: `GET /api/pack-groups/:id`
   - If needed, update distribution: `PUT /api/pack-groups/:id/distribution`

5. **Finalize Shipment**
   ```bash
   POST /api/shipments/:id/finalize
   ```
   - Deducts inventory
   - Changes status to `ready`

6. **Mark as Shipped**
   ```bash
   POST /api/shipments/:id/ship
   {
     "trackingNumber": "1Z999AA10123456784",
     "carrier": "UPS"
   }
   ```

7. **Export for Amazon**
   - Use pack group data to generate CSV
   - Upload CSV to Amazon Seller Central

## CSV Export Format

The pack group data structure matches Amazon's CSV format:

**Header Rows:**
- Pack group: X
- Total SKUs: Y (Z units)
- Total box count: N

**Product Rows:**
| SKU | Product title | Id | ASIN | FNSKU | Condition | Prep type | Expected qty | Boxed qty | Box 1 qty | Box 2 qty | ... |

**Box Detail Rows:**
| Name of box | P1-B1 | P1-B2 | P1-B3 | ... |
| Box weight (lb) | 40 | 40 | 40 | ... |
| Box width (inch) | 17 | 17 | 17 | ... |
| Box length (inch) | 23 | 23 | 23 | ... |
| Box height (inch) | 13 | 13 | 13 | ... |

## Inventory Integration

### Amazon FBA Fields in Inventory

When creating inventory items, include Amazon-specific fields:

```json
{
  "sku": "CP0069",
  "name": "Chanaksha Trading Stainless Steel Idli Stand",
  "asin": "B07J2L93SN",
  "fnsku": "B07J2L93SN",
  "productId": "pkebcdea3b",
  "condition": "NewItem",
  "prepType": "NONE",
  "availableQty": 100,
  "unitWeight": 1.5
}
```

These fields auto-populate when creating pack group shipments.

## Best Practices

### 1. Box Distribution Strategy
- **Weight Balance**: Keep boxes under 50 lbs
- **Similar Products**: Group similar products together
- **Fragile Items**: Place in fewer boxes with proper padding

### 2. Inventory Management
- Always maintain updated ASIN/FNSKU in inventory
- Set `prepType` correctly to avoid Amazon prep fees
- Track `condition` accurately

### 3. Error Prevention
- Verify all SKUs exist before creating pack group
- Double-check `boxQuantities` sum equals `expectedQty`
- Ensure `boxQuantities` array length matches `boxes` count

### 4. Data Validation
```javascript
// Before sending to API
skus.forEach(sku => {
  const totalQty = sku.boxQuantities.reduce((a, b) => a + b, 0);
  if (totalQty !== sku.expectedQty) {
    console.error(`SKU ${sku.sku}: Box quantities sum (${totalQty}) doesn't match expected (${sku.expectedQty})`);
  }
});
```

## Troubleshooting

### Common Issues

**Issue:** "SKU not found in inventory"
- **Solution**: Create the product in inventory first with `POST /api/inventory`

**Issue:** "boxQuantities array length must match boxes count"
- **Solution**: Ensure every SKU has exactly one quantity per box (use 0 for boxes without that SKU)

**Issue:** "Cannot modify a non-draft shipment"
- **Solution**: Only draft shipments can be edited. Once finalized, create a new shipment for changes.

**Issue:** "Insufficient stock"
- **Solution**: Check available inventory with `GET /api/inventory/sku/:sku` and restock if needed

## Frontend UI Suggestions

### Pack Group Builder Interface

1. **Step 1: Shipment Info**
   - Pack Group Number
   - FBA Shipment ID
   - Destination

2. **Step 2: Select Products**
   - List of inventory items
   - Multi-select with quantities

3. **Step 3: Box Configuration**
   - Number of boxes
   - Dimensions per box (or use template)
   - Weight limits

4. **Step 4: Distribution Grid**
   - Rows: Products (SKUs)
   - Columns: Boxes
   - Cells: Quantity inputs
   - Auto-calculate totals per row and column

5. **Step 5: Review & Create**
   - Summary of all data
   - Validation warnings
   - Create button

### Example Grid Layout
```
                BOX1  BOX2  BOX3  BOX4  Total
CP0069 (Idli)    4     4     4     4     16
CP0092 (Pot)     8     8     8     8     32
CP0094 (Pan)     2     2     2     2      8
--------------------------------
Box Total:      14    14    14    14     56
Box Weight:     40    40    40    40    160 lbs
```

## Testing

Use the Postman collection in `/Postman/Seller_Management_Complete_API.postman_collection.json`

Test sequence:
1. Create inventory items with ASIN/FNSKU
2. Create pack group shipment
3. Get pack group data
4. Update distribution (optional)
5. Finalize shipment
6. Verify inventory deduction

---

For more details, see:
- [API Testing Setup](./API_TESTING_SETUP.md)
- [Postman Guide](./POSTMAN_GUIDE.md)
- [Main README](./README.md)

