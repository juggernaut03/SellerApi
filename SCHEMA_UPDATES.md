# Schema Updates - Amazon FBA Pack Group Support

## Overview

The database schemas have been updated to support Amazon FBA pack group workflow, enabling you to create shipments that match Amazon's CSV format for pack groups.

## Updated Models

### 1. Inventory Model (`models/Inventory.js`)

#### New Fields Added

```javascript
{
  // Amazon FBA specific fields
  asin: {
    type: String,
    uppercase: true,
    trim: true,
    index: true,
    comment: 'Amazon Standard Identification Number'
  },
  fnsku: {
    type: String,
    uppercase: true,
    trim: true,
    index: true,
    comment: 'Fulfillment Network SKU'
  },
  productId: {
    type: String,
    trim: true,
    comment: 'Amazon product ID or internal ID'
  },
  condition: {
    type: String,
    enum: ['NewItem', 'UsedLikeNew', 'UsedVeryGood', 'UsedGood', 'UsedAcceptable'],
    default: 'NewItem'
  },
  prepType: {
    type: String,
    enum: ['NONE', 'Polybagging', 'Bubble wrap', 'Taping', 'Labeling', 'Black shrink wrap'],
    default: 'NONE'
  },
  whoPrepUnits: {
    type: String,
    trim: true,
    comment: 'Who prepares units - merchant or Amazon'
  },
  whoLabelUnits: {
    type: String,
    trim: true,
    comment: 'Who labels units - merchant or Amazon'
  }
}
```

#### Field Descriptions

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `asin` | String | Amazon Standard Identification Number | `B07J2L93SN` |
| `fnsku` | String | Fulfillment Network SKU | `X001234567` |
| `productId` | String | Internal or Amazon product ID | `pkebcdea3b` |
| `condition` | String | Product condition | `NewItem` |
| `prepType` | String | Preparation required | `NONE`, `Polybagging` |
| `whoPrepUnits` | String | Who does prep work | `Merchant`, `Amazon` |
| `whoLabelUnits` | String | Who does labeling | `Merchant`, `Amazon` |

#### Example Inventory Item

```json
{
  "sku": "CP0069",
  "name": "Chanaksha Trading Stainless Steel Idli Stand",
  "asin": "B07J2L93SN",
  "fnsku": "B07J2L93SN",
  "productId": "pkebcdea3b-e0e7-48d0-b3a9",
  "condition": "NewItem",
  "prepType": "NONE",
  "whoPrepUnits": "Merchant",
  "whoLabelUnits": "Merchant",
  "availableQty": 100,
  "unitWeight": 1.5,
  "purchasePrice": 15.00,
  "sellingPrice": 29.99
}
```

### 2. Shipment Item Schema (`shipmentItemSchema`)

#### New Fields Added

```javascript
{
  sku: String,
  productName: String,
  // NEW FIELDS
  productId: {
    type: String,
    trim: true
  },
  asin: {
    type: String,
    uppercase: true,
    trim: true
  },
  fnsku: {
    type: String,
    uppercase: true,
    trim: true
  },
  condition: {
    type: String,
    enum: ['NewItem', 'UsedLikeNew', 'UsedVeryGood', 'UsedGood', 'UsedAcceptable'],
    default: 'NewItem'
  },
  prepType: {
    type: String,
    enum: ['NONE', 'Polybagging', 'Bubble wrap', 'Taping', 'Labeling', 'Black shrink wrap'],
    default: 'NONE'
  },
  qty: Number,
  expectedQty: {
    type: Number,
    default: 0,
    comment: 'Total expected quantity for this SKU across all boxes'
  },
  unitWeight: Number,
  totalWeight: Number
}
```

#### Purpose
- Tracks Amazon-specific data per item in each box
- `expectedQty` helps validate that box quantities sum correctly

### 3. Box Schema (`boxSchema`)

#### New Fields Added

```javascript
{
  boxNo: String,
  // NEW FIELD
  boxName: {
    type: String,
    trim: true,
    comment: 'Custom box name like P1-B1, P1-B2'
  },
  items: [shipmentItemSchema],
  boxWeight: {
    type: Number,
    default: 0,
    comment: 'Box weight in lbs or kg'
  },
  dimensions: {
    length: {
      type: Number,
      comment: 'Length in inches'
    },
    width: {
      type: Number,
      comment: 'Width in inches'
    },
    height: {
      type: Number,
      comment: 'Height in inches'
    }
  },
  notes: String
}
```

#### Changes
- Added `boxName` for custom naming (e.g., "P1-B1" for Pack 1, Box 1)
- Enhanced `dimensions` fields with comments

### 4. Shipment Schema (`shipmentSchema`)

#### New Fields Added

```javascript
{
  shipmentId: String,
  // NEW FIELDS
  packGroup: {
    type: String,
    trim: true,
    comment: 'Pack group identifier like 1, 2, etc.'
  },
  fbaShipmentId: {
    type: String,
    trim: true,
    uppercase: true,
    comment: 'Amazon FBA shipment ID'
  },
  destination: String,
  destinationType: String,
  status: String,
  boxes: [boxSchema],
  // NEW FIELD
  totalSKUs: {
    type: Number,
    default: 0,
    comment: 'Total unique SKUs in this shipment'
  },
  totalBoxes: Number,
  totalItems: Number,
  totalWeight: Number,
  // ... other fields
}
```

#### Field Descriptions

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `packGroup` | String | Pack group number | `"1"`, `"2"` |
| `fbaShipmentId` | String | Amazon's shipment ID | `"FBA12345"` |
| `totalSKUs` | Number | Count of unique products | `10` |

#### Updated Pre-Save Hook

The pre-save hook now calculates `totalSKUs`:

```javascript
shipmentSchema.pre('save', function (next) {
  this.totalBoxes = this.boxes.length;
  
  let totalItems = 0;
  let totalWeight = 0;
  const uniqueSKUs = new Set();

  this.boxes.forEach((box) => {
    box.items.forEach((item) => {
      totalItems += item.qty;
      item.totalWeight = item.qty * item.unitWeight;
      uniqueSKUs.add(item.sku.toUpperCase());
    });
    totalWeight += box.boxWeight;
  });

  this.totalItems = totalItems;
  this.totalWeight = totalWeight;
  this.totalSKUs = uniqueSKUs.size;  // NEW

  next();
});
```

## Migration Notes

### For Existing Data

These are **additive changes only** - no existing fields were removed or modified (breaking changes). Your existing data remains intact.

#### Inventory
- Existing inventory items will have new fields as `null` or default values
- You can update items to add ASIN/FNSKU as needed:
  ```javascript
  PATCH /api/inventory/:id
  {
    "asin": "B07J2L93SN",
    "fnsku": "B07J2L93SN",
    "condition": "NewItem",
    "prepType": "NONE"
  }
  ```

#### Shipments
- Existing shipments will calculate `totalSKUs` automatically
- `packGroup` and `fbaShipmentId` will be `null` for existing shipments
- Box `boxName` will be `null` for existing boxes

### No Migration Script Required

MongoDB's flexible schema means:
- Old documents continue to work
- New documents include new fields
- Queries handle missing fields gracefully

## API Impact

### Backward Compatibility

✅ **All existing API endpoints continue to work**

Old requests without new fields:
```json
POST /api/inventory
{
  "sku": "TEST001",
  "name": "Test Product",
  "availableQty": 10
}
// ✅ Works! New fields get default values
```

### New Capabilities

1. **Create inventory with Amazon data**
   ```json
   POST /api/inventory
   {
     "sku": "CP0069",
     "name": "Idli Stand",
     "asin": "B07J2L93SN",
     "fnsku": "B07J2L93SN",
     "condition": "NewItem",
     "prepType": "NONE"
   }
   ```

2. **Create pack group shipments**
   ```json
   POST /api/pack-groups
   {
     "packGroup": "1",
     "fbaShipmentId": "FBA12345",
     "destination": "Amazon FBA TX",
     "skus": [...],
     "boxes": [...]
   }
   ```

3. **Export pack group data**
   ```json
   GET /api/pack-groups/:id
   // Returns data ready for CSV export
   ```

## Database Indexes

### New Indexes Added

```javascript
// Inventory
inventorySchema.index({ asin: 1 });  // For ASIN lookups
inventorySchema.index({ fnsku: 1 }); // For FNSKU lookups
```

### Performance Impact
- Minimal - indexes are on optional fields
- Only impacts new queries using ASIN/FNSKU

## UI Implications

### Inventory Management UI

**Add Optional Fields:**
- ASIN (text input, uppercase)
- FNSKU (text input, uppercase)
- Product ID (text input)
- Condition (dropdown: NewItem, UsedLikeNew, etc.)
- Prep Type (dropdown: NONE, Polybagging, etc.)
- Who Preps Units (text input)
- Who Labels Units (text input)

**Form Validation:**
- ASIN: 10 characters, alphanumeric
- FNSKU: Usually starts with X or B
- Condition: Required for FBA shipments

### Pack Group Builder UI

**New Interface Needed:**

1. **Pack Group Creation Form**
   - Pack Group Number
   - FBA Shipment ID
   - Destination dropdown

2. **Product Selection Grid**
   - Multi-select from inventory
   - Show ASIN/FNSKU for each
   - Auto-filter for items with ASIN

3. **Box Distribution Matrix**
   ```
   SKU      | BOX1 | BOX2 | BOX3 | Total
   ---------|------|------|------|------
   CP0069   |  4   |  4   |  4   |  12
   CP0092   |  8   |  8   |  8   |  24
   ---------|------|------|------|------
   Box Wt   | 40lb | 40lb | 40lb |
   ```

4. **Box Dimensions**
   - Length, Width, Height inputs per box
   - Template selector for standard box sizes

### Shipment Display UI

**Enhanced Shipment Card:**
```
Shipment: SHP2025-0001
Pack Group: 1
FBA ID: FBA12345
Destination: Amazon FBA TX

📦 20 Boxes | 🏷️ 10 SKUs | 📊 636 Units
Status: Draft
```

## Testing

### Test Data

Create inventory with Amazon fields:
```bash
POST /api/inventory
{
  "sku": "TEST-FBA-001",
  "name": "Test FBA Product",
  "asin": "B0TEST1234",
  "fnsku": "X0TEST5678",
  "condition": "NewItem",
  "prepType": "NONE",
  "availableQty": 100,
  "unitWeight": 1.0
}
```

Create pack group:
```bash
POST /api/pack-groups
{
  "packGroup": "1",
  "fbaShipmentId": "FBATEST001",
  "destination": "Test Warehouse",
  "skus": [{
    "sku": "TEST-FBA-001",
    "productName": "Test FBA Product",
    "expectedQty": 20,
    "boxQuantities": [10, 10]
  }],
  "boxes": [
    { "boxNo": "BOX1", "boxWeight": 25, "length": 20, "width": 15, "height": 10 },
    { "boxNo": "BOX2", "boxWeight": 25, "length": 20, "width": 15, "height": 10 }
  ]
}
```

### Validation Tests

1. **Inventory without ASIN**: Should work ✅
2. **Pack group with invalid ASIN**: Validation depends on your rules
3. **Box distribution mismatch**: Should error if `sum(boxQuantities) != expectedQty`
4. **Missing SKU in inventory**: Should error

## Summary

### What Changed
- ✅ Added 7 new fields to Inventory
- ✅ Added 5 new fields to Shipment items
- ✅ Added 1 new field to Box
- ✅ Added 3 new fields to Shipment
- ✅ Updated pre-save hook for `totalSKUs` calculation

### What Didn't Change
- ❌ No fields removed
- ❌ No fields renamed
- ❌ No data types changed
- ❌ No required fields added to existing schemas

### Result
**100% backward compatible** - existing code continues to work without modification.

---

**Next Steps:**
1. Review [Pack Group Guide](./PACK_GROUP_GUIDE.md) for usage details
2. Test with [Postman Collection](./Postman/Seller_Management_Complete_API.postman_collection.json)
3. Update your UI to include new Amazon FBA fields
4. Start creating pack group shipments!

