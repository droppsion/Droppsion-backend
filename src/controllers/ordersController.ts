import { Request, Response } from 'express';
import { Order } from '../types/index';
import { OrderModel } from '../models/Order';
import { isDbConnected } from '../config/db';

// In-memory order fallback
const ORDERS: Order[] = [
  {
    id: 'ORD-8942-DP',
    trackingNumber: 'DP-TRK-8942910',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'shipped',
    customer: {
      name: 'Alexander Wright',
      email: 'alex.wright@example.com',
      phone: '+1 (555) 234-5678',
    },
    shippingAddress: {
      firstName: 'Alexander',
      lastName: 'Wright',
      email: 'alex.wright@example.com',
      phone: '+1 (555) 234-5678',
      addressLine1: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'OR',
      postalCode: '97477',
      country: 'United States',
    },
    items: [
      {
        productId: 'prod-001',
        slug: 'essential-hoodie',
        title: 'Essential Hoodie',
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=600&auto=format&fit=crop',
        price: 59.99,
        quantity: 1,
        variant: { id: 'var-hoodie-oatmeal', name: 'Oatmeal' },
      },
      {
        productId: 'prod-002',
        slug: 'air-max-270',
        title: 'Air Max 270',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop',
        price: 129.99,
        quantity: 1,
        variant: { id: 'var-am270-white', name: 'Triple White / Orange' },
      },
    ],
    subtotal: 189.98,
    discount: 18.99,
    shippingMethod: 'Express Air Courier (2-3 Days)',
    shippingCost: 9.99,
    tax: 15.19,
    total: 196.17,
    carrier: 'FedEx Priority Direct',
    estimatedDeliveryDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    fulfillmentMilestones: [
      {
        status: 'Order Confirmed',
        description: 'Payment authorized and order sent to dropship fulfillment center.',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        completed: true,
      },
      {
        status: 'Inventory Dispatched',
        description: 'Verified by supplier warehouse, packaged with luxury tamper-proof seal.',
        timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(),
        completed: true,
      },
      {
        status: 'In Transit',
        description: 'Customs cleared. Departed international air sorting hub.',
        timestamp: new Date(Date.now() - 86400000 * 0.5).toISOString(),
        completed: true,
      },
      {
        status: 'Out for Delivery',
        description: 'Courier van dispatched for residential delivery.',
        timestamp: '',
        completed: false,
      },
      {
        status: 'Delivered',
        description: 'Signed and delivered at front door.',
        timestamp: '',
        completed: false,
      },
    ],
  },
];

export const getOrders = async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;

    if (isDbConnected()) {
      const query: any = {};
      if (status && status !== 'all') {
        query.status = status;
      }
      if (search && typeof search === 'string') {
        const q = search.trim();
        query.$or = [
          { id: { $regex: q, $options: 'i' } },
          { trackingNumber: { $regex: q, $options: 'i' } },
          { 'customer.name': { $regex: q, $options: 'i' } },
          { 'customer.email': { $regex: q, $options: 'i' } },
        ];
      }

      const orders = await OrderModel.find(query).sort({ createdAt: -1 }).lean();
      return res.json({ success: true, source: 'mongodb', count: orders.length, orders });
    }

    let filtered = [...ORDERS];
    if (status && status !== 'all') {
      filtered = filtered.filter((o) => o.status === status);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.trackingNumber.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.email.toLowerCase().includes(q)
      );
    }

    return res.json({ success: true, source: 'memory', count: filtered.length, orders: filtered });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch orders', error });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const {
      customer,
      shippingAddress,
      items,
      subtotal,
      discount = 0,
      shippingCost = 0,
      shippingMethod = 'Standard Worldwide (3-5 Days)',
      tax = 0,
      total,
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Order must contain at least 1 item' });
    }

    if (!shippingAddress || !shippingAddress.addressLine1 || !shippingAddress.city) {
      return res.status(400).json({ success: false, message: 'Valid shipping address is required' });
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const trackingSuffix = Math.floor(1000000 + Math.random() * 9000000);
    const orderId = `ORD-${randomSuffix}-DP`;
    const trackingNumber = `DP-TRK-${trackingSuffix}`;

    const newOrderData: Order = {
      id: orderId,
      trackingNumber,
      createdAt: new Date().toISOString(),
      status: 'confirmed',
      customer: customer || {
        name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        email: shippingAddress.email,
        phone: shippingAddress.phone,
      },
      shippingAddress,
      items,
      subtotal: parseFloat(subtotal) || 0,
      discount: parseFloat(discount) || 0,
      shippingMethod,
      shippingCost: parseFloat(shippingCost) || 0,
      tax: parseFloat(tax) || 0,
      total: parseFloat(total) || 0,
      carrier: 'DHL Express International',
      estimatedDeliveryDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
      fulfillmentMilestones: [
        {
          status: 'Order Confirmed',
          description: 'Payment authorized and order sent to dropship fulfillment center.',
          timestamp: new Date().toISOString(),
          completed: true,
        },
        {
          status: 'Inventory Dispatched',
          description: 'Verified by supplier warehouse, packaged with tamper-proof seal.',
          timestamp: '',
          completed: false,
        },
        {
          status: 'In Transit',
          description: 'Customs cleared. Departed sorting facility.',
          timestamp: '',
          completed: false,
        },
        {
          status: 'Out for Delivery',
          description: 'Courier van dispatched for delivery.',
          timestamp: '',
          completed: false,
        },
        {
          status: 'Delivered',
          description: 'Delivered to recipient address.',
          timestamp: '',
          completed: false,
        },
      ],
    };

    if (isDbConnected()) {
      const created = await OrderModel.create(newOrderData);
      return res.status(201).json({
        success: true,
        source: 'mongodb',
        message: 'Order created successfully in MongoDB',
        order: created,
      });
    }

    ORDERS.unshift(newOrderData);

    return res.status(201).json({
      success: true,
      source: 'memory',
      message: 'Order created successfully',
      order: newOrderData,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const order = await OrderModel.findOne({
        $or: [{ id: new RegExp(`^${id}$`, 'i') }, { trackingNumber: new RegExp(`^${id}$`, 'i') }],
      }).lean();

      if (!order) {
        return res.status(404).json({ success: false, message: `Order '${id}' not found` });
      }

      return res.json({ success: true, source: 'mongodb', order });
    }

    const order = ORDERS.find(
      (o) => o.id.toLowerCase() === id.toLowerCase() || o.trackingNumber.toLowerCase() === id.toLowerCase()
    );

    if (!order) {
      return res.status(404).json({ success: false, message: `Order '${id}' not found` });
    }

    return res.json({ success: true, source: 'memory', order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch order', error });
  }
};

export const trackOrder = async (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.params;

    if (isDbConnected()) {
      const order = await OrderModel.findOne({
        $or: [
          { trackingNumber: new RegExp(`^${trackingNumber}$`, 'i') },
          { id: new RegExp(`^${trackingNumber}$`, 'i') },
        ],
      }).lean();

      if (!order) {
        return res.status(404).json({
          success: false,
          message: `Tracking record for '${trackingNumber}' not found. Please verify your tracking number.`,
        });
      }

      return res.json({
        success: true,
        source: 'mongodb',
        tracking: {
          orderId: order.id,
          trackingNumber: order.trackingNumber,
          status: order.status,
          carrier: order.carrier,
          estimatedDeliveryDate: order.estimatedDeliveryDate,
          shippingAddress: {
            city: order.shippingAddress.city,
            country: order.shippingAddress.country,
          },
          itemsCount: order.items.reduce((acc, i) => acc + i.quantity, 0),
          milestones: order.fulfillmentMilestones,
        },
      });
    }

    const order = ORDERS.find(
      (o) =>
        o.trackingNumber.toLowerCase() === trackingNumber.toLowerCase() ||
        o.id.toLowerCase() === trackingNumber.toLowerCase()
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Tracking record for '${trackingNumber}' not found. Please verify your tracking number.`,
      });
    }

    return res.json({
      success: true,
      source: 'memory',
      tracking: {
        orderId: order.id,
        trackingNumber: order.trackingNumber,
        status: order.status,
        carrier: order.carrier,
        estimatedDeliveryDate: order.estimatedDeliveryDate,
        shippingAddress: {
          city: order.shippingAddress.city,
          country: order.shippingAddress.country,
        },
        itemsCount: order.items.reduce((acc, i) => acc + i.quantity, 0),
        milestones: order.fulfillmentMilestones,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to track order', error });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    if (isDbConnected()) {
      const updated = await OrderModel.findOneAndUpdate(
        { id },
        { $set: { status } },
        { new: true }
      ).lean();

      if (!updated) {
        return res.status(404).json({ success: false, message: `Order '${id}' not found` });
      }

      return res.json({ success: true, source: 'mongodb', order: updated });
    }

    const order = ORDERS.find((o) => o.id === id);
    if (!order) {
      return res.status(404).json({ success: false, message: `Order '${id}' not found` });
    }

    order.status = status;
    return res.json({ success: true, source: 'memory', order });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update order status', error: error.message });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const deleted = await OrderModel.findOneAndDelete({
        $or: [{ id }, { trackingNumber: id }],
      });
      if (!deleted) {
        return res.status(404).json({ success: false, message: `Order '${id}' not found` });
      }
      return res.json({ success: true, source: 'mongodb', message: `Order '${id}' deleted successfully` });
    }

    const initialLength = ORDERS.length;
    const filtered = ORDERS.filter((o) => o.id !== id && o.trackingNumber !== id);
    if (filtered.length === initialLength) {
      return res.status(404).json({ success: false, message: `Order '${id}' not found` });
    }

    ORDERS.length = 0;
    ORDERS.push(...filtered);

    return res.json({ success: true, source: 'memory', message: `Order '${id}' deleted successfully` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete order', error: error.message });
  }
};
