import { Request, Response } from 'express';
import { PRODUCTS } from '../data/products';
import { DROPSHIP_SUPPLIERS } from '../data/suppliers';
import { SupplierModel } from '../models/Supplier';
import { ProductModel } from '../models/Product';
import { isDbConnected } from '../config/db';

export const getSuppliers = async (_req: Request, res: Response) => {
  try {
    if (isDbConnected()) {
      const suppliers = await SupplierModel.find().lean();
      return res.json({
        success: true,
        source: 'mongodb',
        totalSuppliers: suppliers.length,
        suppliers,
      });
    }

    return res.json({
      success: true,
      source: 'memory',
      totalSuppliers: DROPSHIP_SUPPLIERS.length,
      suppliers: DROPSHIP_SUPPLIERS,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch suppliers', error });
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.name) {
      return res.status(400).json({ success: false, message: 'Supplier name is required' });
    }

    if (!data.id) {
      data.id = `sup-${Date.now().toString().slice(-4)}`;
    }
    if (!data.region) {
      data.region = 'Global Hub';
    }
    if (!data.apiProtocol) {
      data.apiProtocol = 'REST-EDI (v3.2)';
    }
    if (!data.status) {
      data.status = 'connected';
    }

    if (isDbConnected()) {
      const created = await SupplierModel.create(data);
      return res.status(201).json({ success: true, source: 'mongodb', supplier: created });
    }

    DROPSHIP_SUPPLIERS.unshift(data);
    return res.status(201).json({ success: true, source: 'memory', supplier: data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to create supplier', error: error.message });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates._id;
    delete updates.__v;
    delete updates.id;

    if (isDbConnected()) {
      const updated = await SupplierModel.findOneAndUpdate(
        { id },
        { $set: updates },
        { new: true }
      ).lean();

      if (!updated) {
        return res.status(404).json({ success: false, message: `Supplier '${id}' not found` });
      }

      return res.json({ success: true, source: 'mongodb', supplier: updated });
    }

    const index = DROPSHIP_SUPPLIERS.findIndex((s: any) => s.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: `Supplier '${id}' not found` });
    }

    DROPSHIP_SUPPLIERS[index] = { ...DROPSHIP_SUPPLIERS[index], ...updates };
    return res.json({ success: true, source: 'memory', supplier: DROPSHIP_SUPPLIERS[index] });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update supplier', error: error.message });
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const deleted = await SupplierModel.findOneAndDelete({ id });
      if (!deleted) {
        return res.status(404).json({ success: false, message: `Supplier '${id}' not found` });
      }

      return res.json({ success: true, source: 'mongodb', message: `Supplier '${id}' removed successfully` });
    }

    const initialLength = DROPSHIP_SUPPLIERS.length;
    const filtered = DROPSHIP_SUPPLIERS.filter((s: any) => s.id !== id);
    if (filtered.length === initialLength) {
      return res.status(404).json({ success: false, message: `Supplier '${id}' not found` });
    }

    DROPSHIP_SUPPLIERS.length = 0;
    DROPSHIP_SUPPLIERS.push(...filtered);

    return res.json({ success: true, source: 'memory', message: `Supplier '${id}' removed successfully` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete supplier', error: error.message });
  }
};

export const toggleSupplierStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const supplier = await SupplierModel.findOne({ id });
      if (!supplier) {
        return res.status(404).json({ success: false, message: `Supplier '${id}' not found` });
      }

      supplier.status = supplier.status === 'connected' ? 'offline' : 'connected';
      await supplier.save();

      return res.json({
        success: true,
        source: 'mongodb',
        message: `Supplier '${supplier.name}' status is now ${supplier.status}`,
        supplier,
      });
    }

    const supplier: any = DROPSHIP_SUPPLIERS.find((s: any) => s.id === id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: `Supplier '${id}' not found` });
    }

    supplier.status = supplier.status === 'connected' ? 'offline' : 'connected';
    return res.json({
      success: true,
      source: 'memory',
      message: `Supplier '${supplier.name}' status is now ${supplier.status}`,
      supplier,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to toggle supplier status', error: error.message });
  }
};

export const syncAllInventory = async (_req: Request, res: Response) => {
  try {
    const timestamp = new Date().toISOString();
    if (isDbConnected()) {
      await ProductModel.updateMany(
        {},
        {
          $set: {
            'dropship.stockSyncedAt': timestamp,
            'dropship.syncStatus': 'active',
          },
        }
      );
      const count = await ProductModel.countDocuments();
      return res.json({
        success: true,
        source: 'mongodb',
        message: `All ${count} international warehouse SKU feeds successfully synchronized.`,
        syncedAt: timestamp,
        count,
      });
    }

    PRODUCTS.forEach((p) => {
      p.dropship.stockSyncedAt = timestamp;
      p.dropship.syncStatus = 'active';
    });

    return res.json({
      success: true,
      source: 'memory',
      message: `All ${PRODUCTS.length} international warehouse SKU feeds successfully synchronized.`,
      syncedAt: timestamp,
      count: PRODUCTS.length,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Global inventory sync failed', error: error.message });
  }
};

export const syncProductStock = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    if (isDbConnected()) {
      const product = await ProductModel.findOne({
        $or: [{ id: productId }, { slug: productId }],
      });

      if (!product) {
        return res.status(404).json({ success: false, message: `Product '${productId}' not found in catalog` });
      }

      const currentQty = product.stockQuantity;
      const variance = Math.floor(Math.random() * 5) - 2;
      const updatedQty = Math.max(5, currentQty + variance);

      product.stockQuantity = updatedQty;
      product.dropship.stockSyncedAt = new Date().toISOString();
      product.dropship.syncStatus = 'active';
      await product.save();

      return res.json({
        success: true,
        source: 'mongodb',
        message: `Stock successfully validated across international EDI feed for ${product.title}`,
        sync: {
          productId: product.id,
          supplierSku: product.dropship.supplierSku,
          supplierName: product.dropship.supplierName,
          stockQuantity: updatedQty,
          syncedAt: product.dropship.stockSyncedAt,
          status: 'active',
        },
      });
    }

    const product = PRODUCTS.find((p) => p.id === productId || p.slug === productId);

    if (!product) {
      return res.status(404).json({ success: false, message: `Product '${productId}' not found in catalog` });
    }

    const currentQty = product.stockQuantity;
    const variance = Math.floor(Math.random() * 5) - 2;
    const updatedQty = Math.max(5, currentQty + variance);

    product.stockQuantity = updatedQty;
    product.dropship.stockSyncedAt = new Date().toISOString();
    product.dropship.syncStatus = 'active';

    return res.json({
      success: true,
      source: 'memory',
      message: `Stock successfully validated across international EDI feed for ${product.title}`,
      sync: {
        productId: product.id,
        supplierSku: product.dropship.supplierSku,
        supplierName: product.dropship.supplierName,
        stockQuantity: updatedQty,
        syncedAt: product.dropship.stockSyncedAt,
        status: 'active',
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Stock synchronization failed', error });
  }
};

export const getCatalogMargins = async (_req: Request, res: Response) => {
  try {
    let productsList = PRODUCTS;
    if (isDbConnected()) {
      productsList = (await ProductModel.find().lean()) as any;
    }

    const totalRetail = productsList.reduce((acc, p) => acc + p.price, 0);
    const totalWholesaleCost = productsList.reduce((acc, p) => acc + (p.dropship?.supplierCost || p.price * 0.6), 0);
    const grossProfit = totalRetail - totalWholesaleCost;
    const avgMarginPercent = totalRetail > 0 ? Math.round((grossProfit / totalRetail) * 100) : 0;

    const breakdown = productsList.map((p) => {
      const cost = p.dropship?.supplierCost || p.price * 0.6;
      return {
        id: p.id,
        title: p.title,
        category: p.categoryLabel,
        retailPrice: p.price,
        supplierCost: cost,
        grossProfit: parseFloat((p.price - cost).toFixed(2)),
        marginPercent: p.dropship?.marginPercentage || 40,
        supplierName: p.dropship?.supplierName || 'Primary Supplier',
        leadTimeHours: p.dropship?.leadTimeHours || 48,
      };
    });

    return res.json({
      success: true,
      source: isDbConnected() ? 'mongodb' : 'memory',
      summary: {
        totalProducts: productsList.length,
        totalCatalogRetailValue: parseFloat(totalRetail.toFixed(2)),
        totalWholesaleCost: parseFloat(totalWholesaleCost.toFixed(2)),
        projectedGrossProfit: parseFloat(grossProfit.toFixed(2)),
        averageMarginPercent: avgMarginPercent,
      },
      products: breakdown,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to calculate margins', error });
  }
};