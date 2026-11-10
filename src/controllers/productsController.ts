import { Request, Response } from 'express';
import { PRODUCTS, CATEGORIES } from '../data/products';
import { ProductModel } from '../models/Product';
import { isDbConnected } from '../config/db';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      rating,
      badge,
      inStock,
      isActive,
      includeInactive,
      sortBy = 'featured',
      page = '1',
      limit = '100',
    } = req.query;

    const showAll = includeInactive === 'true' || isActive === 'all';

    if (isDbConnected()) {
      const query: any = {};

      // Filter active status:
      // Public / Storefront requests (showAll is false) must NEVER receive deactivated products!
      if (!showAll) {
        if (isActive === 'false') {
          query.isActive = false;
        } else {
          query.isActive = { $ne: false };
        }
      } else if (isActive === 'true') {
        query.isActive = { $ne: false };
      } else if (isActive === 'false') {
        query.isActive = false;
      }

      if (category && category !== 'all') {
        query.category = { $regex: new RegExp(`^${category}$`, 'i') };
      }

      if (search && typeof search === 'string' && search.trim() !== '') {
        const q = search.trim();
        query.$or = [
          { title: { $regex: q, $options: 'i' } },
          { subtitle: { $regex: q, $options: 'i' } },
          { categoryLabel: { $regex: q, $options: 'i' } },
          { 'dropship.supplierSku': { $regex: q, $options: 'i' } },
          { 'dropship.supplierName': { $regex: q, $options: 'i' } },
          { tags: { $in: [new RegExp(q, 'i')] } },
        ];
      }

      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseFloat(minPrice as string);
        if (maxPrice) query.price.$lte = parseFloat(maxPrice as string);
      }

      if (rating) {
        query.rating = { $gte: parseFloat(rating as string) };
      }

      if (badge) {
        query.badge = badge;
      }

      if (inStock === 'true') {
        query.inStock = true;
        query.stockQuantity = { $gt: 0 };
      }

      let sortOptions: any = {};
      switch (sortBy) {
        case 'price-asc':
          sortOptions = { price: 1 };
          break;
        case 'price-desc':
          sortOptions = { price: -1 };
          break;
        case 'rating':
          sortOptions = { rating: -1 };
          break;
        case 'newest':
          sortOptions = { createdAt: -1 };
          break;
        case 'best-selling':
          sortOptions = { reviewCount: -1 };
          break;
        default:
          sortOptions = { createdAt: -1 };
          break;
      }

      const pageNum = parseInt(page as string, 10) || 1;
      const pageSize = parseInt(limit as string, 10) || 100;
      const skip = (pageNum - 1) * pageSize;

      const total = await ProductModel.countDocuments(query);
      const products = await ProductModel.find(query).sort(sortOptions).skip(skip).limit(pageSize).lean();

      return res.json({
        success: true,
        source: 'mongodb',
        total,
        page: pageNum,
        totalPages: Math.ceil(total / pageSize),
        products,
      });
    }

    // In-memory fallback
    let filtered = [...PRODUCTS];

    // Filter active status:
    if (!showAll) {
      if (isActive === 'false') {
        filtered = filtered.filter((p) => (p as any).isActive === false);
      } else {
        // Public storefront: ONLY active products!
        filtered = filtered.filter((p) => (p as any).isActive !== false);
      }
    } else if (isActive === 'true') {
      filtered = filtered.filter((p) => (p as any).isActive !== false);
    } else if (isActive === 'false') {
      filtered = filtered.filter((p) => (p as any).isActive === false);
    }

    if (category && category !== 'all') {
      filtered = filtered.filter((p) => p.category.toLowerCase() === (category as string).toLowerCase());
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.subtitle && p.subtitle.toLowerCase().includes(q)) ||
          p.categoryLabel.toLowerCase().includes(q) ||
          (p.dropship?.supplierSku && p.dropship.supplierSku.toLowerCase().includes(q)) ||
          (p.dropship?.supplierName && p.dropship.supplierName.toLowerCase().includes(q)) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    if (minPrice) {
      const min = parseFloat(minPrice as string);
      if (!isNaN(min)) filtered = filtered.filter((p) => p.price >= min);
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice as string);
      if (!isNaN(max)) filtered = filtered.filter((p) => p.price <= max);
    }

    if (rating) {
      const r = parseFloat(rating as string);
      if (!isNaN(r)) filtered = filtered.filter((p) => p.rating >= r);
    }

    if (badge) {
      filtered = filtered.filter((p) => p.badge?.toLowerCase() === (badge as string).toLowerCase());
    }

    if (inStock === 'true') {
      filtered = filtered.filter((p) => p.inStock && p.stockQuantity > 0);
    }

    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered.sort((a, b) => (a.badge === 'NEW' ? -1 : 1));
        break;
      case 'best-selling':
        filtered.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      default:
        break;
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 100;
    const total = filtered.length;
    const startIndex = (pageNum - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    return res.json({
      success: true,
      source: 'memory',
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize),
      products: paginated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch products', error });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const product = await ProductModel.findOne({
        $or: [{ id }, { slug: id }],
      }).lean();

      if (!product) {
        return res.status(404).json({ success: false, message: `Product '${id}' not found` });
      }

      return res.json({ success: true, source: 'mongodb', product });
    }

    const product = PRODUCTS.find((p) => p.id === id || p.slug === id);
    if (!product) {
      return res.status(404).json({ success: false, message: `Product '${id}' not found` });
    }

    return res.json({ success: true, source: 'memory', product });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch product details', error });
  }
};

export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    if (isDbConnected()) {
      const product = await ProductModel.findOne({ slug }).lean();
      if (!product || (product as any).isActive === false) {
        return res.status(404).json({ success: false, message: `Product '${slug}' is currently unavailable.` });
      }

      const related = await ProductModel.find({
        category: product.category,
        id: { $ne: product.id },
        isActive: { $ne: false },
      })
        .limit(4)
        .lean();

      return res.json({
        success: true,
        source: 'mongodb',
        product,
        related,
      });
    }

    const product = PRODUCTS.find((p) => p.slug === slug);
    if (!product || (product as any).isActive === false) {
      return res.status(404).json({ success: false, message: `Product '${slug}' is currently unavailable.` });
    }

    const related = PRODUCTS.filter(
      (p) => p.category === product.category && p.id !== product.id && (p as any).isActive !== false
    ).slice(0, 4);

    return res.json({
      success: true,
      source: 'memory',
      product,
      related,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch product details', error });
  }
};

export const getCategories = async (_req: Request, res: Response) => {
  try {
    if (isDbConnected()) {
      const counts = await ProductModel.aggregate([
        { $match: { isActive: { $ne: false } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]);
      const countMap: Record<string, number> = {};
      counts.forEach((item) => {
        countMap[item._id] = item.count;
      });

      const totalCount = await ProductModel.countDocuments({ isActive: { $ne: false } });

      const categoriesWithCount = CATEGORIES.map((cat) => ({
        ...cat,
        productCount: cat.slug === 'all' ? totalCount : countMap[cat.slug] || 0,
      }));

      return res.json({
        success: true,
        source: 'mongodb',
        categories: categoriesWithCount,
      });
    }

    const activeList = PRODUCTS.filter((p) => (p as any).isActive !== false);
    const categoriesWithCount = CATEGORIES.map((cat) => {
      const count =
        cat.slug === 'all'
          ? activeList.length
          : activeList.filter((p) => p.category === cat.slug).length;
      return {
        ...cat,
        productCount: count,
      };
    });

    return res.json({
      success: true,
      source: 'memory',
      categories: categoriesWithCount,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch categories', error });
  }
};

export const getFeaturedProducts = async (_req: Request, res: Response) => {
  try {
    if (isDbConnected()) {
      const [newArrivals, bestSellers, onSale] = await Promise.all([
        ProductModel.find({ badge: 'NEW', isActive: { $ne: false } }).limit(8).lean(),
        ProductModel.find({
          $or: [{ badge: 'BESTSELLER' }, { reviewCount: { $gt: 90 } }],
          isActive: { $ne: false },
        })
          .limit(6)
          .lean(),
        ProductModel.find({
          $or: [{ badge: 'SALE' }, { originalPrice: { $gt: 0 } }],
          isActive: { $ne: false },
        })
          .limit(6)
          .lean(),
      ]);

      return res.json({
        success: true,
        source: 'mongodb',
        newArrivals,
        bestSellers,
        onSale,
      });
    }

    const activeProducts = PRODUCTS.filter((p) => (p as any).isActive !== false);
    const newArrivals = activeProducts.filter((p) => p.badge === 'NEW').slice(0, 8);
    const bestSellers = activeProducts.filter((p) => p.badge === 'BESTSELLER' || p.reviewCount > 90).slice(0, 6);
    const onSale = activeProducts.filter((p) => p.badge === 'SALE' || (p.originalPrice && p.originalPrice > p.price)).slice(0, 6);

    return res.json({
      success: true,
      source: 'memory',
      newArrivals,
      bestSellers,
      onSale,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch featured products', error });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const productData = { ...req.body };
    delete productData._id;
    delete productData.__v;

    if (!productData.title || productData.price === undefined || !productData.category) {
      return res.status(400).json({ success: false, message: 'Title, price, and category are required' });
    }

    if (!productData.id) {
      productData.id = `prod-${Date.now().toString().slice(-4)}`;
    }
    if (!productData.slug) {
      productData.slug = productData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    if (!productData.categoryLabel) {
      productData.categoryLabel = productData.category;
    }
    if (!productData.description) {
      productData.description = `${productData.title} - premium catalog offering.`;
    }
    if (productData.isActive === undefined) {
      productData.isActive = true;
    }
    if (productData.inStock === undefined) {
      productData.inStock = productData.stockQuantity > 0;
    }
    if (!productData.images || !productData.images.length) {
      productData.images = [productData.image || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=400'];
    }
    if (!productData.dropship) {
      productData.dropship = {
        supplierId: 'sup-apparel-la',
        supplierName: 'Nova Studio Apparel',
        supplierSku: productData.slug.toUpperCase(),
        supplierCost: productData.price * 0.6,
        marginPercentage: 40,
        markupMultiplier: 1.67,
        fulfillmentCenter: 'Los Angeles Hub',
        countryOfOrigin: 'USA',
        leadTimeHours: 24,
        estimatedTransitDays: '2-4 days',
        shippingCarriers: ['FedEx', 'DHL'],
        stockSyncedAt: new Date().toISOString(),
        syncStatus: 'active',
      };
    }

    if (isDbConnected()) {
      const created = await ProductModel.create(productData);
      return res.status(201).json({ success: true, source: 'mongodb', product: created });
    }

    PRODUCTS.unshift(productData);
    return res.status(201).json({ success: true, source: 'memory', product: productData });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to create product', error: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates._id;
    delete updates.__v;
    delete updates.id;

    if (isDbConnected()) {
      const updated = await ProductModel.findOneAndUpdate(
        { $or: [{ id }, { slug: id }] },
        { $set: updates },
        { new: true }
      ).lean();

      if (!updated) {
        return res.status(404).json({ success: false, message: `Product '${id}' not found` });
      }

      return res.json({ success: true, source: 'mongodb', product: updated });
    }

    const index = PRODUCTS.findIndex((p) => p.id === id || p.slug === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: `Product '${id}' not found` });
    }

    PRODUCTS[index] = { ...PRODUCTS[index], ...updates };
    return res.json({ success: true, source: 'memory', product: PRODUCTS[index] });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const deleted = await ProductModel.findOneAndDelete({
        $or: [{ id }, { slug: id }],
      });

      if (!deleted) {
        return res.status(404).json({ success: false, message: `Product '${id}' not found` });
      }

      return res.json({ success: true, source: 'mongodb', message: `Product '${id}' deleted successfully` });
    }

    const initialLength = PRODUCTS.length;
    const filtered = PRODUCTS.filter((p) => p.id !== id && p.slug !== id);
    if (filtered.length === initialLength) {
      return res.status(404).json({ success: false, message: `Product '${id}' not found` });
    }

    PRODUCTS.length = 0;
    PRODUCTS.push(...filtered);

    return res.json({ success: true, source: 'memory', message: `Product '${id}' deleted successfully` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
  }
};

export const toggleProductStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive, inStock } = req.body;

    if (isDbConnected()) {
      const product = await ProductModel.findOne({
        $or: [{ id }, { slug: id }],
      });

      if (!product) {
        return res.status(404).json({ success: false, message: `Product '${id}' not found` });
      }

      const nextActive = isActive !== undefined ? isActive : !(product as any).isActive;
      (product as any).isActive = nextActive;
      if (inStock !== undefined) {
        product.inStock = inStock;
      } else if (!nextActive) {
        product.inStock = false;
      }
      await product.save();

      return res.json({
        success: true,
        source: 'mongodb',
        message: `Product '${product.title}' is now ${nextActive ? 'Active' : 'Deactivated'}`,
        product,
      });
    }

    const product: any = PRODUCTS.find((p) => p.id === id || p.slug === id);
    if (!product) {
      return res.status(404).json({ success: false, message: `Product '${id}' not found` });
    }

    const nextActive = isActive !== undefined ? isActive : !product.isActive;
    product.isActive = nextActive;
    if (inStock !== undefined) {
      product.inStock = inStock;
    } else if (!nextActive) {
      product.inStock = false;
    }

    return res.json({
      success: true,
      source: 'memory',
      message: `Product '${product.title}' is now ${nextActive ? 'Active' : 'Deactivated'}`,
      product,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to toggle product status', error: error.message });
  }
};